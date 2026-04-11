/**
 * In-App Purchase service — wraps react-native-iap for both iOS StoreKit
 * and Android Play Billing.
 *
 * Usage pattern:
 *   1. Call initIAP() once near app startup (e.g. root layout useEffect).
 *   2. Call setupPurchaseListeners() to handle incoming transactions.
 *   3. Call teardownIAP() on app unmount / when listeners are no longer needed.
 *
 * Product IDs must be registered in App Store Connect and Google Play Console
 * before purchases will work on real devices.
 *
 * Server-side receipt validation:
 *   This implementation trusts the store's success callback. For production,
 *   send the receipt/token to your Cloud Functions endpoint and validate against
 *   Apple/Google servers before calling activatePremium().
 */

import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
  flushFailedPurchasesCachedAsPendingAndroid,
  finishTransaction,
  getAvailablePurchases,
} from 'react-native-iap';
import type { Subscription, ProductPurchase, PurchaseError } from 'react-native-iap';
import { Platform } from 'react-native';
import { getProfile, saveProfile } from './storage';
import { syncProfileToCloud } from './firestore';

// ─── Product IDs ────────────────────────────────────────────────────────────
// Must match exactly what you register in App Store Connect / Google Play Console.

export const SKUS = {
  MONTHLY: 'com.chesterclub.app.premium.monthly',
  YEARLY: 'com.chesterclub.app.premium.yearly',
} as const;

export type SubscriptionPlan = 'monthly' | 'yearly';

const SKU_TO_PLAN: Record<string, SubscriptionPlan> = {
  [SKUS.MONTHLY]: 'monthly',
  [SKUS.YEARLY]: 'yearly',
};

// Local expiry estimate — the store handles actual renewal, this is only used
// for a graceful client-side downgrade check if the store can't be reached.
const PLAN_DURATION_MS: Record<SubscriptionPlan, number> = {
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

// ─── Connection state ────────────────────────────────────────────────────────

let _connected = false;

export async function initIAP(): Promise<void> {
  try {
    await initConnection();
    _connected = true;
    // Android: clear stale pending purchases from a previous session
    if (Platform.OS === 'android') {
      await flushFailedPurchasesCachedAsPendingAndroid();
    }
  } catch (err) {
    // Not fatal — IAP is unavailable on simulators, in dev without billing
    // accounts, or on devices without Google Play Services.
    console.warn('[IAP] initConnection failed:', err);
  }
}

export async function teardownIAP(): Promise<void> {
  if (_connected) {
    await endConnection();
    _connected = false;
  }
}

export function isIAPAvailable(): boolean {
  return _connected;
}

// ─── Product catalogue ───────────────────────────────────────────────────────

export async function fetchSubscriptions(): Promise<Subscription[]> {
  if (!_connected) return [];
  try {
    return await getSubscriptions({ skus: [SKUS.MONTHLY, SKUS.YEARLY] });
  } catch (err) {
    console.warn('[IAP] getSubscriptions failed:', err);
    return [];
  }
}

// ─── Purchase flow ───────────────────────────────────────────────────────────

export async function purchaseSubscription(plan: SubscriptionPlan): Promise<void> {
  const sku = plan === 'monthly' ? SKUS.MONTHLY : SKUS.YEARLY;
  // requestSubscription is intentionally not awaited — the result comes back
  // via the purchaseUpdatedListener set up in setupPurchaseListeners().
  await requestSubscription({ sku });
}

// ─── Internal: activate premium in local storage ─────────────────────────────

async function activatePremium(
  productId: string,
  transactionId: string,
  purchaseTime: number,
): Promise<void> {
  const plan = SKU_TO_PLAN[productId] ?? 'monthly';
  const profile = await getProfile();
  profile.isPremiumMax = true;
  profile.subscription = {
    plan,
    purchasedAt: purchaseTime,
    expiresAt: purchaseTime + PLAN_DURATION_MS[plan],
    transactionId,
    platform: Platform.OS as 'ios' | 'android',
  };
  await saveProfile(profile);
  syncProfileToCloud().catch(() => {});
}

// ─── Listeners ───────────────────────────────────────────────────────────────

/**
 * Sets up purchase update + error listeners.
 * Returns a cleanup function — call it when the component unmounts.
 */
export function setupPurchaseListeners(
  onSuccess: () => void,
  onError: (message: string) => void,
): () => void {
  const successListener = purchaseUpdatedListener(async (purchase: ProductPurchase) => {
    const { productId, transactionId, transactionDate } = purchase;
    if (!transactionId) return;

    await activatePremium(productId, transactionId, transactionDate ?? Date.now());
    // Acknowledge the transaction — required on both platforms to avoid refunds.
    await finishTransaction({ purchase, isConsumable: false });
    onSuccess();
  });

  const errorListener = purchaseErrorListener((error: PurchaseError) => {
    // E_USER_CANCELLED is not an error worth surfacing — user simply backed out.
    if ((error as any).code !== 'E_USER_CANCELLED') {
      onError(error.message ?? 'Purchase failed. Please try again.');
    }
  });

  return () => {
    successListener.remove();
    errorListener.remove();
  };
}

// ─── Restore purchases ───────────────────────────────────────────────────────

/**
 * Queries the store for prior purchases and reactivates premium if found.
 * Returns true if at least one valid subscription was restored.
 */
export async function restorePremiumPurchases(): Promise<boolean> {
  if (!_connected) return false;
  try {
    const purchases = await getAvailablePurchases();
    let restored = false;
    for (const purchase of purchases) {
      const plan = SKU_TO_PLAN[purchase.productId];
      if (plan && purchase.transactionId) {
        await activatePremium(
          purchase.productId,
          purchase.transactionId,
          purchase.transactionDate ?? Date.now(),
        );
        await finishTransaction({ purchase, isConsumable: false });
        restored = true;
        break; // one active subscription is enough
      }
    }
    return restored;
  } catch (err) {
    console.warn('[IAP] getAvailablePurchases failed:', err);
    return false;
  }
}

// ─── Expiry check ────────────────────────────────────────────────────────────

/**
 * Checks whether the locally stored subscription estimate has expired and
 * downgrades gracefully if so. Call this at app startup after initIAP().
 *
 * NOTE: This is a client-side safety net. The store controls actual renewals
 * and will surface the subscription in getAvailablePurchases() while active.
 * Users who have renewed will regain premium via restorePremiumPurchases().
 */
export async function checkSubscriptionExpiry(): Promise<void> {
  const profile = await getProfile();
  if (!profile.isPremiumMax || !profile.subscription) return;
  if (Date.now() > profile.subscription.expiresAt) {
    // Attempt restore first in case the subscription was renewed
    if (_connected) {
      const stillActive = await restorePremiumPurchases();
      if (stillActive) return;
    }
    profile.isPremiumMax = false;
    profile.subscription = undefined;
    await saveProfile(profile);
  }
}
