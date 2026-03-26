import AsyncStorage from '@react-native-async-storage/async-storage';
import { getShopItemById, ShopCategory } from '../constants/shopItems';
import { getProfile, saveProfile, activateStreakShield } from './storage';

// ─── Shop Service ───
//
// Manages purchased and equipped cosmetic items.
// Owned items stored in AsyncStorage, equipped items as a category->itemId map.

const SHOP_KEY = 'shop_state';

export interface ShopState {
  ownedItems: string[];
  equipped: Record<string, string>; // category -> itemId
}

async function getShopState(): Promise<ShopState> {
  const raw = await AsyncStorage.getItem(SHOP_KEY);
  if (raw) return JSON.parse(raw);
  return { ownedItems: [], equipped: {} };
}

async function saveShopState(state: ShopState): Promise<void> {
  await AsyncStorage.setItem(SHOP_KEY, JSON.stringify(state));
}

export async function getOwnedItems(): Promise<string[]> {
  const state = await getShopState();
  return state.ownedItems;
}

export async function getEquippedItems(): Promise<Record<string, string>> {
  const state = await getShopState();
  return state.equipped;
}

export async function purchaseItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  const item = getShopItemById(itemId);
  if (!item) return { success: false, error: 'Item not found' };

  const profile = await getProfile();
  const state = await getShopState();

  // Consumables can be re-purchased; regular items cannot
  if (item.category !== 'consumable' && state.ownedItems.includes(itemId)) {
    return { success: false, error: 'Already owned' };
  }

  // Premium check
  if (item.premium && !profile.isPremiumMax) {
    return { success: false, error: 'Premium required' };
  }

  // Enough coins?
  if (profile.chester.coins < item.price) {
    return { success: false, error: 'Not enough coins' };
  }

  // Deduct coins
  profile.chester.coins -= item.price;
  await saveProfile(profile);

  // Consumables trigger effects instead of being stored as owned
  if (item.category === 'consumable') {
    if (itemId === 'consumable_streak_shield') {
      const activated = await activateStreakShield();
      if (!activated) {
        // Refund — shield already active
        profile.chester.coins += item.price;
        await saveProfile(profile);
        return { success: false, error: 'Streak shield already active' };
      }
    }
    return { success: true };
  }

  state.ownedItems.push(itemId);
  await saveShopState(state);

  return { success: true };
}

export async function equipItem(itemId: string): Promise<boolean> {
  const item = getShopItemById(itemId);
  if (!item) return false;

  const state = await getShopState();
  if (!state.ownedItems.includes(itemId)) return false;

  state.equipped[item.category] = itemId;
  await saveShopState(state);
  return true;
}

export async function unequipCategory(category: ShopCategory): Promise<void> {
  const state = await getShopState();
  delete state.equipped[category];
  await saveShopState(state);
}

export async function isItemOwned(itemId: string): Promise<boolean> {
  const state = await getShopState();
  return state.ownedItems.includes(itemId);
}

export async function isItemEquipped(itemId: string): Promise<boolean> {
  const item = getShopItemById(itemId);
  if (!item) return false;
  const state = await getShopState();
  return state.equipped[item.category] === itemId;
}
