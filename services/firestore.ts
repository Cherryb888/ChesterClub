import {
  doc, setDoc, getDoc, getDocs, deleteDoc, collection,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, getCurrentUser, isFirebaseConfigured } from './firebase';
import { getProfile, saveProfile, getDailyLog, getWaterLog, getTodayKey, getChallengesState, getSettings, saveSettings, AppSettings } from './storage';
import { UserProfile, DailyLog, WaterLog, ChallengesState } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Helpers ───

function getUserDocRef(path: string) {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return null;
  return doc(db, 'users', user.uid, ...path.split('/'));
}

function getUserCollectionRef(path: string) {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return null;
  return collection(db, 'users', user.uid, ...path.split('/'));
}

export function canSync(): boolean {
  return isFirebaseConfigured && getCurrentUser() !== null && getDb() !== null;
}

// ─── Profile Sync ───

export async function syncProfileToCloud(): Promise<void> {
  if (!canSync()) return;
  const ref = getUserDocRef('profile');
  if (!ref) return;

  const profile = await getProfile();
  await setDoc(ref, {
    ...profile,
    lastSyncedAt: serverTimestamp(),
  }, { merge: true });
}

export async function pullProfileFromCloud(): Promise<UserProfile | null> {
  if (!canSync()) return null;
  const ref = getUserDocRef('profile');
  if (!ref) return null;

  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  if (!data) return null;
  // Remove Firestore-specific fields
  delete data.lastSyncedAt;
  return data as UserProfile;
}

export async function mergeProfileFromCloud(): Promise<void> {
  if (!canSync()) return;

  const cloudProfile = await pullProfileFromCloud();
  if (!cloudProfile) {
    // No cloud data — push local to cloud
    await syncProfileToCloud();
    return;
  }

  const localProfile = await getProfile();

  // Merge strategy: use whichever has more progress
  // Chester: keep higher level/xp/streak/coins
  const merged: UserProfile = {
    ...localProfile,
    displayName: cloudProfile.displayName || localProfile.displayName,
    goals: cloudProfile.goals || localProfile.goals,
    chester: {
      ...localProfile.chester,
      level: Math.max(localProfile.chester.level, cloudProfile.chester.level),
      xp: localProfile.chester.level > cloudProfile.chester.level
        ? localProfile.chester.xp
        : cloudProfile.chester.level > localProfile.chester.level
          ? cloudProfile.chester.xp
          : Math.max(localProfile.chester.xp, cloudProfile.chester.xp),
      streak: Math.max(localProfile.chester.streak, cloudProfile.chester.streak),
      coins: Math.max(localProfile.chester.coins, cloudProfile.chester.coins),
      health: Math.max(localProfile.chester.health, cloudProfile.chester.health),
      // Merge achievements (union)
      achievements: [...new Set([...localProfile.chester.achievements, ...cloudProfile.chester.achievements])],
      // Keep most recent mood and fed date
      mood: (localProfile.chester.lastFedDate || '') >= (cloudProfile.chester.lastFedDate || '')
        ? localProfile.chester.mood
        : cloudProfile.chester.mood,
      lastFedDate: (localProfile.chester.lastFedDate || '') >= (cloudProfile.chester.lastFedDate || '')
        ? localProfile.chester.lastFedDate
        : cloudProfile.chester.lastFedDate,
      outfit: localProfile.chester.outfit,
      previousStreak: Math.max(localProfile.chester.previousStreak || 0, cloudProfile.chester.previousStreak || 0),
    },
    // Merge weight history (union by date, prefer most recent value)
    weightHistory: mergeWeightHistory(localProfile.weightHistory, cloudProfile.weightHistory),
    isPremiumMax: localProfile.isPremiumMax || cloudProfile.isPremiumMax,
  };

  await saveProfile(merged);
  await syncProfileToCloud();
}

function mergeWeightHistory(
  local: { date: string; weight: number; unit: 'kg' | 'lbs' }[],
  cloud: { date: string; weight: number; unit: 'kg' | 'lbs' }[]
): { date: string; weight: number; unit: 'kg' | 'lbs' }[] {
  const map = new Map<string, { weight: number; unit: 'kg' | 'lbs' }>();
  // Cloud first, then local overrides
  for (const entry of cloud) map.set(entry.date, { weight: entry.weight, unit: entry.unit || 'kg' });
  for (const entry of local) map.set(entry.date, { weight: entry.weight, unit: entry.unit || 'kg' });
  return Array.from(map.entries())
    .map(([date, { weight, unit }]) => ({ date, weight, unit }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Food Log Sync ───

export async function syncFoodLogToCloud(date: string): Promise<void> {
  if (!canSync()) return;
  const ref = getUserDocRef(`foodLogs/${date}`);
  if (!ref) return;

  const log = await getDailyLog(date);
  await setDoc(ref, {
    ...log,
    syncedAt: serverTimestamp(),
  });
}

export async function pullFoodLogFromCloud(date: string): Promise<DailyLog | null> {
  if (!canSync()) return null;
  const ref = getUserDocRef(`foodLogs/${date}`);
  if (!ref) return null;

  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  delete data.syncedAt;
  return data as DailyLog;
}

export async function syncRecentFoodLogs(days: number = 7): Promise<void> {
  if (!canSync()) return;

  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const date = d.toISOString().split('T')[0];
    await syncFoodLogToCloud(date);
  }
}

// ─── Water Log Sync ───

export async function syncWaterLogToCloud(date: string): Promise<void> {
  if (!canSync()) return;
  const ref = getUserDocRef(`waterLogs/${date}`);
  if (!ref) return;

  const log = await getWaterLog(date);
  await setDoc(ref, {
    ...log,
    syncedAt: serverTimestamp(),
  });
}

export async function pullWaterLogFromCloud(date: string): Promise<WaterLog | null> {
  if (!canSync()) return null;
  const ref = getUserDocRef(`waterLogs/${date}`);
  if (!ref) return null;

  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  delete data.syncedAt;
  return data as WaterLog;
}

// ─── Challenges Sync ───

export async function syncChallengesToCloud(): Promise<void> {
  if (!canSync()) return;
  const ref = getUserDocRef('challenges');
  if (!ref) return;

  const state = await getChallengesState();
  await setDoc(ref, {
    ...state,
    syncedAt: serverTimestamp(),
  });
}

// ─── Settings Sync ───

export async function syncSettingsToCloud(): Promise<void> {
  if (!canSync()) return;
  const ref = getUserDocRef('settings');
  if (!ref) return;

  const settings = await getSettings();
  await setDoc(ref, {
    ...settings,
    syncedAt: serverTimestamp(),
  });
}

export async function pullSettingsFromCloud(): Promise<AppSettings | null> {
  if (!canSync()) return null;
  const ref = getUserDocRef('settings');
  if (!ref) return null;

  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  delete data.syncedAt;
  return data as AppSettings;
}

// ─── Full Sync ───

export async function performFullSync(): Promise<{ success: boolean; error?: string }> {
  if (!canSync()) {
    return { success: false, error: 'Not signed in or Firebase not configured' };
  }

  try {
    // 1. Merge profile (bidirectional)
    await mergeProfileFromCloud();

    // 2. Sync recent food logs (last 7 days)
    await syncRecentFoodLogs(7);

    // 3. Sync today's water log
    const today = getTodayKey();
    await syncWaterLogToCloud(today);

    // 4. Sync challenges
    await syncChallengesToCloud();

    // 5. Sync settings
    await syncSettingsToCloud();

    // Record last sync time
    await AsyncStorage.setItem('last_cloud_sync', new Date().toISOString());

    return { success: true };
  } catch (error: any) {
    console.error('Sync failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem('last_cloud_sync');
}

// ─── Account + Data Deletion ───
//
// Deletes all Firestore data for the current user, then wipes AsyncStorage.
// Call this BEFORE deleteCurrentUser() from firebase.ts.

export async function deleteAllUserData(): Promise<void> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) {
    // Not signed in — just wipe local storage
    await AsyncStorage.clear();
    return;
  }

  const uid = user.uid;

  // Delete all documents in a subcollection
  async function wipeSubcollection(...segments: string[]) {
    try {
      const ref = collection(db!, 'users', uid, ...segments);
      const snap = await getDocs(ref);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    } catch {
      // Best-effort — may lack permission if already partially deleted
    }
  }

  // Wipe all known subcollections in parallel
  await Promise.all([
    wipeSubcollection('foodLogs'),
    wipeSubcollection('waterLogs'),
    wipeSubcollection('feed'),
    wipeSubcollection('friends'),
    wipeSubcollection('pushTokens'),
  ]);

  // Delete known top-level documents under users/{uid}
  const knownDocs = ['profile', 'challenges', 'settings'];
  await Promise.all(
    knownDocs.map(name =>
      deleteDoc(doc(db!, 'users', uid, name)).catch(() => {})
    )
  );

  // Delete public profile and friend code
  await deleteDoc(doc(db!, 'publicProfiles', uid)).catch(() => {});
  const friendCode = await AsyncStorage.getItem('my_friend_code');
  if (friendCode) {
    await deleteDoc(doc(db!, 'friendCodes', friendCode)).catch(() => {});
  }

  // Wipe all local storage last
  await AsyncStorage.clear();
}

// ─── First Login Sync ───
// Called when a user signs in — pulls cloud data and merges with local

export async function onUserSignIn(): Promise<void> {
  if (!canSync()) return;

  // Merge profile from cloud
  await mergeProfileFromCloud();

  // Pull settings if they exist in cloud
  const cloudSettings = await pullSettingsFromCloud();
  if (cloudSettings) {
    await saveSettings(cloudSettings);
  }
}
