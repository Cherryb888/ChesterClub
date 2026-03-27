import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from './keys';
import { DEFAULT_GOALS, DEFAULT_CHESTER, DEFAULT_DIET_PROFILE } from './profileStorage';

// ─── Schema Versioning & Migration ───
//
// Bump CURRENT_SCHEMA_VERSION whenever the data shape changes.
// Add a new case to runMigrations() for each version bump.
//
// History:
//   1 - Initial MVP (food logs, basic chester)
//   2 - Added health, achievements, coins to Chester
//   3 - Added water tracking, challenges, premium
//   4 - Added previousStreak, weight history
//   5 - Added settings, data export, cloud sync (Phase 2)
//   6 - Added unit field to weight history entries
//   7 - Added streakShieldActive to Chester state
//   8 - Added dietProfile to UserProfile

const CURRENT_SCHEMA_VERSION = 8;

export async function runMigrations(): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.SCHEMA_VERSION);
  const currentVersion = raw ? parseInt(raw, 10) : 0;

  if (currentVersion >= CURRENT_SCHEMA_VERSION) return;

  const profileData = await AsyncStorage.getItem(KEYS.PROFILE);
  if (!profileData) {
    await AsyncStorage.setItem(KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
    return;
  }

  const profile = JSON.parse(profileData);
  let migrated = false;

  // v0/v1 → v2: Add chester health, achievements, coins
  if (currentVersion < 2) {
    if (profile.chester) {
      if (profile.chester.health === undefined) profile.chester.health = 70;
      if (!profile.chester.achievements) profile.chester.achievements = [];
      if (profile.chester.coins === undefined) profile.chester.coins = 0;
    }
    migrated = true;
  }

  // v2 → v3: Add water goals, challenges, premium flag
  if (currentVersion < 3) {
    if (profile.goals && profile.goals.dailyWaterGlasses === undefined) {
      profile.goals.dailyWaterGlasses = 8;
    }
    if (profile.isPremiumMax === undefined) profile.isPremiumMax = false;
    migrated = true;
  }

  // v3 → v4: Add previousStreak, weight history
  if (currentVersion < 4) {
    if (profile.chester && profile.chester.previousStreak === undefined) {
      profile.chester.previousStreak = 0;
    }
    if (!profile.weightHistory) profile.weightHistory = [];
    migrated = true;
  }

  // v4 → v5: Ensure all fields present for cloud sync compatibility
  if (currentVersion < 5) {
    if (!profile.uid) profile.uid = 'local_user';
    if (!profile.email) profile.email = '';
    if (!profile.displayName) profile.displayName = 'Friend';
    if (!profile.goals) profile.goals = DEFAULT_GOALS;
    if (!profile.chester) profile.chester = DEFAULT_CHESTER;
    if (profile.createdAt === undefined) profile.createdAt = Date.now();
    if (profile.onboardingComplete === undefined) profile.onboardingComplete = false;
    migrated = true;
  }

  // v5 → v6: Add unit field to weight history entries
  if (currentVersion < 6) {
    if (profile.weightHistory && Array.isArray(profile.weightHistory)) {
      profile.weightHistory = profile.weightHistory.map((e: any) => ({
        ...e,
        unit: e.unit || 'kg',
      }));
    }
    migrated = true;
  }

  // v6 → v7: Add streakShieldActive to Chester state
  if (currentVersion < 7) {
    if (profile.chester && profile.chester.streakShieldActive === undefined) {
      profile.chester.streakShieldActive = false;
    }
    migrated = true;
  }

  // v7 → v8: Add dietProfile
  if (currentVersion < 8) {
    if (!profile.dietProfile) {
      profile.dietProfile = DEFAULT_DIET_PROFILE;
    }
    migrated = true;
  }

  if (migrated) {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  }
  await AsyncStorage.setItem(KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
}

export async function getSchemaVersion(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.SCHEMA_VERSION);
  return raw ? parseInt(raw, 10) : 0;
}
