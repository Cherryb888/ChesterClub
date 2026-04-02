import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getDb, getCurrentUser } from './firebase';

const FUNCTIONS_BASE_URL = process.env.EXPO_PUBLIC_FUNCTIONS_URL || '';

// ─── Push Token Service ───
//
// Registers the device's Expo push token with Firestore so that
// Cloud Functions can send push notifications cross-device.
//
// Token stored at: users/{uid}/pushTokens/{installationId}
// The installationId is stable per-app-install (from expo-constants).

function getInstallationId(): string {
  // expo-constants provides a stable per-install ID
  return Constants.installationId ?? Constants.sessionId ?? 'unknown';
}

export async function registerPushToken(): Promise<void> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return;

  try {
    // Only physical devices get real Expo push tokens
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const token = tokenData.data;
    if (!token) return;

    const installId = getInstallationId();

    await setDoc(
      doc(db, 'users', user.uid, 'pushTokens', installId),
      {
        token,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // Silently ignore — simulators, missing project ID, or revoked permission
  }
}

export async function unregisterPushToken(): Promise<void> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return;

  try {
    const installId = getInstallationId();
    await deleteDoc(doc(db, 'users', user.uid, 'pushTokens', installId));
  } catch {
    // Best-effort cleanup
  }
}

// ─── Send push notification via Cloud Function ───
//
// Fires a push notification to another user (e.g. a friend).
// No-ops silently if Cloud Functions aren't deployed yet.

export async function sendPushToUser(
  targetUid: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!FUNCTIONS_BASE_URL) return; // Cloud Functions not deployed yet

  const user = getCurrentUser();
  if (!user) return;

  try {
    const token = await user.getIdToken();
    await fetch(`${FUNCTIONS_BASE_URL}/sendPushNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUid, title, body, data }),
    });
  } catch {
    // Best-effort — never throw from notification delivery
  }
}
