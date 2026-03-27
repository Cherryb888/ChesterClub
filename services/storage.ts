import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, DailyLog, UserProfile, ChesterState, UserGoals, ChesterLifeStage, MealPlan, WaterLog, Challenge, ChallengeProgress, ChallengesState, DietProfile } from '../types';

// ─── Background Cloud Sync ───
// Uses the offline-first sync queue: syncs immediately when online,
// queues for later when offline.

import { smartSync } from './syncQueue';
import { checkAchievements, AchievementCheckContext } from './achievementChecker';
import { AchievementDefinition } from '../constants/achievements';
import { getMilestoneForDay, StreakMilestone } from '../constants/streakRewards';

function syncProfileBackground() {
  smartSync({ type: 'profile' }).catch(() => {});
}

function syncFoodLogBackground(date: string) {
  smartSync({ type: 'foodLog', date }).catch(() => {});
}

function syncWaterLogBackground(date: string) {
  smartSync({ type: 'waterLog', date }).catch(() => {});
}

function syncChallengesBackground() {
  smartSync({ type: 'challenges' }).catch(() => {});
}

const KEYS = {
  PROFILE: 'user_profile',
  LOG_PREFIX: 'food_log_',
  ONBOARDING: 'onboarding_complete',
  MEAL_PLAN: 'current_meal_plan',
  WATER_PREFIX: 'water_log_',
  CHALLENGES: 'challenges_state',
  SCHEMA_VERSION: 'schema_version',
  TOTAL_SCANS: 'total_food_scans',
  PENDING_ACHIEVEMENTS: 'pending_achievement_unlocks',
  PENDING_MILESTONE: 'pending_streak_milestone',
};

// ─── Schema Versioning & Migration ───
//
// CURRENT_SCHEMA_VERSION should be bumped whenever the data shape changes.
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

  // Get existing profile (if any) for migration
  const profileData = await AsyncStorage.getItem(KEYS.PROFILE);
  if (!profileData) {
    // No profile yet — fresh install, just set version
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

  // Save migrated profile and update version
  if (migrated) {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  }
  await AsyncStorage.setItem(KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
}

export async function getSchemaVersion(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.SCHEMA_VERSION);
  return raw ? parseInt(raw, 10) : 0;
}

// ─── Profile ───

const DEFAULT_GOALS: UserGoals = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 200,
  dailyFat: 65,
  dailyWaterGlasses: 8,
};

const DEFAULT_DIET_PROFILE: DietProfile = {
  gender: 'prefer_not_to_say',
  age: 25,
  heightCm: 170,
  currentWeightKg: 70,
  targetWeightKg: 70,
  fitnessGoal: 'maintain',
  dietType: 'no_restriction',
  allergies: [],
  dislikedFoods: [],
  cookingLevel: 'intermediate',
  mealsPerDay: 3,
  maxPrepTimeMinutes: 30,
  cuisinePreferences: [],
};

const DEFAULT_CHESTER: ChesterState = {
  level: 1,
  xp: 0,
  mood: 'happy',
  streak: 0,
  lastFedDate: null,
  outfit: 'default',
  health: 70,
  achievements: [],
  coins: 0,
  previousStreak: 0,
  streakShieldActive: false,
};

export async function getProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(KEYS.PROFILE);
  if (data) {
    const profile = JSON.parse(data);
    // Ensure all fields exist (defensive — migrations should handle this,
    // but this protects against edge cases like cloud-pulled data)
    if (!profile.chester) profile.chester = DEFAULT_CHESTER;
    if (profile.chester.health === undefined) profile.chester.health = 70;
    if (!profile.chester.achievements) profile.chester.achievements = [];
    if (profile.chester.coins === undefined) profile.chester.coins = 0;
    if (!profile.goals) profile.goals = DEFAULT_GOALS;
    if (profile.goals.dailyWaterGlasses === undefined) profile.goals.dailyWaterGlasses = 8;
    if (profile.isPremiumMax === undefined) profile.isPremiumMax = false;
    if (profile.chester.previousStreak === undefined) profile.chester.previousStreak = 0;
    if (profile.chester.streakShieldActive === undefined) profile.chester.streakShieldActive = false;
    if (!profile.weightHistory) profile.weightHistory = [];
    if (!profile.dietProfile) profile.dietProfile = DEFAULT_DIET_PROFILE;
    return profile;
  }
  const profile: UserProfile = {
    uid: 'local_user',
    email: '',
    displayName: 'Friend',
    goals: DEFAULT_GOALS,
    dietProfile: DEFAULT_DIET_PROFILE,
    chester: DEFAULT_CHESTER,
    createdAt: Date.now(),
    onboardingComplete: false,
    weightHistory: [],
    isPremiumMax: false,
  };
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  return profile;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  syncProfileBackground();
}

export async function updateGoals(goals: UserGoals): Promise<void> {
  const profile = await getProfile();
  profile.goals = goals;
  await saveProfile(profile);
}

// ─── Chester Growth System ───

export function getChesterLifeStage(level: number): ChesterLifeStage {
  if (level >= 50) return 'golden';
  if (level >= 31) return 'champion';
  if (level >= 16) return 'adult';
  if (level >= 6) return 'young';
  return 'puppy';
}

export const LIFE_STAGE_INFO: Record<ChesterLifeStage, { name: string; emoji: string; description: string; color: string }> = {
  puppy: { name: 'Puppy', emoji: '🐶', description: 'Tiny, clumsy, always hungry', color: '#FFB380' },
  young: { name: 'Young Dog', emoji: '🐕', description: 'Energetic & playful', color: '#FF8C42' },
  adult: { name: 'Adult Dog', emoji: '🦮', description: 'Strong & confident', color: '#E07030' },
  champion: { name: 'Champion Dog', emoji: '🏆🐕', description: 'Muscular, wears a medal', color: '#FFD700' },
  golden: { name: 'Golden Chester', emoji: '👑🐕‍🦺', description: 'Peak health, legendary!', color: '#FFD700' },
};

function getStreakMultiplier(streak: number): number {
  if (streak >= 60) return 5;
  if (streak >= 30) return 3;
  if (streak >= 7) return 2;
  return 1;
}

export async function getChester(): Promise<ChesterState> {
  const profile = await getProfile();
  return profile.chester;
}

export async function updateChester(updates: Partial<ChesterState>): Promise<ChesterState> {
  const profile = await getProfile();
  profile.chester = { ...profile.chester, ...updates };
  await saveProfile(profile);
  return profile.chester;
}

export async function addCoins(amount: number): Promise<number> {
  const profile = await getProfile();
  // Double coins for max premium subscribers
  const finalAmount = profile.isPremiumMax ? amount * 2 : amount;
  profile.chester.coins += finalAmount;
  await saveProfile(profile);
  return finalAmount;
}

export async function incrementTotalScans(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.TOTAL_SCANS);
  const count = (raw ? parseInt(raw, 10) : 0) + 1;
  await AsyncStorage.setItem(KEYS.TOTAL_SCANS, String(count));
  return count;
}

export async function getTotalScans(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.TOTAL_SCANS);
  return raw ? parseInt(raw, 10) : 0;
}

// Queue of achievements to show celebration modals for
export async function getPendingAchievements(): Promise<AchievementDefinition[]> {
  const raw = await AsyncStorage.getItem(KEYS.PENDING_ACHIEVEMENTS);
  return raw ? JSON.parse(raw) : [];
}

export async function popPendingAchievement(): Promise<AchievementDefinition | null> {
  const pending = await getPendingAchievements();
  if (pending.length === 0) return null;
  const [first, ...rest] = pending;
  await AsyncStorage.setItem(KEYS.PENDING_ACHIEVEMENTS, JSON.stringify(rest));
  return first;
}

async function queuePendingAchievements(achievements: AchievementDefinition[]): Promise<void> {
  if (achievements.length === 0) return;
  const existing = await getPendingAchievements();
  await AsyncStorage.setItem(KEYS.PENDING_ACHIEVEMENTS, JSON.stringify([...existing, ...achievements]));
}

// ─── Streak Milestone Queue ───

export async function getPendingMilestone(): Promise<StreakMilestone | null> {
  const raw = await AsyncStorage.getItem(KEYS.PENDING_MILESTONE);
  if (!raw) return null;
  const milestone = JSON.parse(raw);
  await AsyncStorage.removeItem(KEYS.PENDING_MILESTONE);
  return milestone;
}

async function queueMilestone(milestone: StreakMilestone): Promise<void> {
  await AsyncStorage.setItem(KEYS.PENDING_MILESTONE, JSON.stringify(milestone));
}

// ─── Streak Shield ───

export async function activateStreakShield(): Promise<boolean> {
  const profile = await getProfile();
  if (profile.chester.streakShieldActive) return false; // already active
  profile.chester.streakShieldActive = true;
  await saveProfile(profile);
  return true;
}

export function isStreakShieldActive(chester: ChesterState): boolean {
  return chester.streakShieldActive;
}

// ─── Weekly Stats ───

export async function getWeeklyStats(): Promise<{
  totalMeals: number;
  avgCalories: number;
  avgNutritionScore: number;
  waterGoalDays: number;
  streakCurrent: number;
  daysLogged: number;
}> {
  const profile = await getProfile();
  const today = new Date();
  let totalMeals = 0;
  let totalCalories = 0;
  let totalScore = 0;
  let waterGoalDays = 0;
  let daysLogged = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const log = await getDailyLog(key);
    const water = await getWaterLog(key);

    if (log.items.length > 0) {
      daysLogged++;
      totalMeals += log.items.length;
      totalCalories += log.totalCalories;
      totalScore += calculateNutritionScore(log, profile.goals);
    }
    if (water.goalReached) waterGoalDays++;
  }

  return {
    totalMeals,
    avgCalories: daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0,
    avgNutritionScore: daysLogged > 0 ? Math.round(totalScore / daysLogged) : 0,
    waterGoalDays,
    streakCurrent: profile.chester.streak,
    daysLogged,
  };
}

export async function feedChester(foodScore: string): Promise<ChesterState> {
  const profile = await getProfile();
  const today = new Date().toISOString().split('T')[0];
  const chester = profile.chester;

  // Update streak
  if (chester.lastFedDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (chester.lastFedDate === yesterday) {
      chester.streak = chester.streak + 1;
      chester.previousStreak = 0;
    } else {
      chester.previousStreak = chester.streak;
      chester.streak = 1;
    }
    chester.lastFedDate = today;

    // Check for streak milestone reward
    const milestone = getMilestoneForDay(chester.streak);
    if (milestone) {
      chester.coins += profile.isPremiumMax ? milestone.coins * 2 : milestone.coins;
      await queueMilestone(milestone);
    }
  }

  // Award XP based on food quality with streak multiplier
  const xpMap: Record<string, number> = { great: 20, good: 15, okay: 10, poor: 5 };
  const baseXp = xpMap[foodScore] || 10;
  const multiplier = getStreakMultiplier(chester.streak);
  chester.xp += baseXp * multiplier;

  // Level up every 100 XP (scales with level)
  while (chester.xp >= chester.level * 100) {
    chester.xp -= chester.level * 100;
    chester.level += 1;
  }

  // Update health based on food score
  const healthMap: Record<string, number> = { great: 8, good: 5, okay: 2, poor: -3 };
  chester.health = Math.min(100, Math.max(0, chester.health + (healthMap[foodScore] || 0)));

  // Set mood based on food score and health
  if (chester.health < 30) {
    chester.mood = 'sad';
  } else if (foodScore === 'great') {
    chester.mood = 'excited';
  } else if (foodScore === 'good') {
    chester.mood = 'happy';
  } else {
    chester.mood = 'neutral';
  }

  // Increment scan counter
  const totalScans = await incrementTotalScans();

  // Check achievements using the achievement checker
  const todayLog = await getDailyLog(today);
  const waterLog = await getWaterLog(today);
  const score = calculateNutritionScore(todayLog, profile.goals);

  const ctx: AchievementCheckContext = {
    profile: { ...profile, chester },
    todayLog,
    waterLog,
    totalScans,
    nutritionScore: score,
  };

  const newlyUnlocked = checkAchievements(ctx);
  if (newlyUnlocked.length > 0) {
    for (const achievement of newlyUnlocked) {
      chester.achievements.push(achievement.id);
      if (achievement.coinReward > 0) {
        chester.coins += profile.isPremiumMax ? achievement.coinReward * 2 : achievement.coinReward;
      }
    }
    await queuePendingAchievements(newlyUnlocked);
  }

  profile.chester = chester;
  await saveProfile(profile);
  return chester;
}

export async function checkChesterDecay(): Promise<ChesterState> {
  const profile = await getProfile();
  const chester = profile.chester;
  const today = new Date().toISOString().split('T')[0];

  if (chester.lastFedDate && chester.lastFedDate !== today) {
    const lastFed = new Date(chester.lastFedDate).getTime();
    const daysSince = Math.floor((Date.now() - lastFed) / 86400000);

    if (daysSince >= 2) {
      // Streak shield protects one missed day
      if (chester.streakShieldActive && daysSince === 2 && chester.streak > 0) {
        chester.streakShieldActive = false;
        chester.lastFedDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        // Shield consumed — streak preserved, small health loss
        chester.health = Math.max(0, chester.health - 5);
        chester.mood = 'neutral';
      } else {
        const healthLoss = (daysSince - 1) * 10;
        chester.health = Math.max(0, chester.health - healthLoss);
        chester.mood = chester.health < 30 ? 'sad' : 'hungry';
        if (chester.streak > 0) {
          chester.previousStreak = chester.streak;
          chester.streak = 0;
        }
      }
    }
  }

  profile.chester = chester;
  await saveProfile(profile);
  return chester;
}

// ─── Streak Recovery ───

export function getStreakRecoveryCost(streak: number): number {
  if (streak > 90) return 500;
  if (streak > 60) return 300;
  if (streak > 30) return 150;
  if (streak > 7) return 75;
  return 25;
}

export async function checkStreakRecoveryAvailable(): Promise<{ available: boolean; previousStreak: number; cost: number; coins: number } | null> {
  const profile = await getProfile();
  const chester = profile.chester;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (chester.previousStreak > 0 && chester.lastFedDate !== today && chester.lastFedDate !== yesterday) {
    return {
      available: true,
      previousStreak: chester.previousStreak,
      cost: getStreakRecoveryCost(chester.previousStreak),
      coins: chester.coins,
    };
  }
  return null;
}

export async function recoverStreak(): Promise<{ success: boolean; newStreak: number; cost: number }> {
  const profile = await getProfile();
  const chester = profile.chester;
  const cost = getStreakRecoveryCost(chester.previousStreak);

  if (chester.previousStreak <= 0 || chester.coins < cost) {
    return { success: false, newStreak: chester.streak, cost };
  }

  chester.coins -= cost;
  chester.streak = chester.previousStreak;
  chester.lastFedDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]; // yesterday
  chester.previousStreak = 0;
  profile.chester = chester;
  await saveProfile(profile);
  return { success: true, newStreak: chester.streak, cost };
}

export async function dismissStreakRecovery(): Promise<void> {
  const profile = await getProfile();
  profile.chester.previousStreak = 0;
  await saveProfile(profile);
}

// ─── Water Tracking ───

export async function getWaterLog(date?: string): Promise<WaterLog> {
  const key = date || getTodayKey();
  const data = await AsyncStorage.getItem(KEYS.WATER_PREFIX + key);
  if (data) return JSON.parse(data);
  return { date: key, glasses: 0, goalReached: false };
}

export async function addWaterGlass(date?: string): Promise<WaterLog> {
  const key = date || getTodayKey();
  const log = await getWaterLog(key);
  const profile = await getProfile();
  const goal = profile.goals.dailyWaterGlasses;

  // Only increment if goal not yet reached
  if (!log.goalReached) {
    log.glasses += 1;
    if (log.glasses >= goal) {
      log.goalReached = true;
    }
  }
  await AsyncStorage.setItem(KEYS.WATER_PREFIX + key, JSON.stringify(log));
  syncWaterLogBackground(key);
  return log;
}

export async function removeWaterGlass(date?: string): Promise<WaterLog> {
  const key = date || getTodayKey();
  const log = await getWaterLog(key);
  if (log.glasses > 0) {
    log.glasses -= 1;
    log.goalReached = false;
  }
  await AsyncStorage.setItem(KEYS.WATER_PREFIX + key, JSON.stringify(log));
  syncWaterLogBackground(key);
  return log;
}

// ─── Food Log ───

function getLogKey(date: string): string {
  return KEYS.LOG_PREFIX + date;
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getDailyLog(date: string): Promise<DailyLog> {
  const data = await AsyncStorage.getItem(getLogKey(date));
  if (data) return JSON.parse(data);
  return { date, items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
}

export async function addFoodToLog(item: FoodItem, date?: string): Promise<DailyLog> {
  const key = date || getTodayKey();
  const log = await getDailyLog(key);
  log.items.push(item);
  log.totalCalories = log.items.reduce((s, i) => s + i.calories, 0);
  log.totalProtein = log.items.reduce((s, i) => s + i.protein, 0);
  log.totalCarbs = log.items.reduce((s, i) => s + i.carbs, 0);
  log.totalFat = log.items.reduce((s, i) => s + i.fat, 0);
  await AsyncStorage.setItem(getLogKey(key), JSON.stringify(log));
  syncFoodLogBackground(key);
  return log;
}

export async function removeFoodFromLog(itemId: string, date?: string): Promise<DailyLog> {
  const key = date || getTodayKey();
  const log = await getDailyLog(key);
  log.items = log.items.filter(i => i.id !== itemId);
  log.totalCalories = log.items.reduce((s, i) => s + i.calories, 0);
  log.totalProtein = log.items.reduce((s, i) => s + i.protein, 0);
  log.totalCarbs = log.items.reduce((s, i) => s + i.carbs, 0);
  log.totalFat = log.items.reduce((s, i) => s + i.fat, 0);
  await AsyncStorage.setItem(getLogKey(key), JSON.stringify(log));
  syncFoodLogBackground(key);
  return log;
}

export async function getWeekLogs(): Promise<DailyLog[]> {
  const logs: DailyLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    logs.push(await getDailyLog(key));
  }
  return logs;
}

export async function getMonthLogs(year: number, month: number): Promise<Record<string, DailyLog>> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const logs: Record<string, DailyLog> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = await getDailyLog(date);
    if (log.items.length > 0) {
      logs[date] = log;
    }
  }
  return logs;
}

// Count total meals logged all time (for all-time challenges)
export async function getTotalMealsLogged(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const logKeys = keys.filter(k => k.startsWith(KEYS.LOG_PREFIX));
  let total = 0;
  for (const key of logKeys) {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const log: DailyLog = JSON.parse(data);
      total += log.items.length;
    }
  }
  return total;
}

// ─── Nutrition Score ───

export function calculateNutritionScore(log: DailyLog, goals: UserGoals): number {
  if (log.items.length === 0) return 0;

  // Score based on how close to goals (capped at 100% - no bonus for going over)
  const calRatio = Math.min(log.totalCalories / goals.dailyCalories, 1);
  const proRatio = Math.min(log.totalProtein / goals.dailyProtein, 1);
  const carbRatio = Math.min(log.totalCarbs / goals.dailyCarbs, 1);
  const fatRatio = Math.min(log.totalFat / goals.dailyFat, 1);

  // Penalize going over goal
  const calOver = log.totalCalories > goals.dailyCalories ? (log.totalCalories - goals.dailyCalories) / goals.dailyCalories : 0;
  const penalty = Math.min(calOver * 30, 20); // max 20 point penalty for going over

  const rawScore = ((calRatio + proRatio + carbRatio + fatRatio) / 4) * 100;
  return Math.max(0, Math.round(rawScore - penalty));
}

// ─── Challenges ───

export const DAILY_CHALLENGES: Challenge[] = [
  { id: 'daily_log_3', type: 'daily', title: 'Log 3 Meals', description: 'Log at least 3 meals today', target: 3, reward: 10, icon: '🍽️' },
  { id: 'daily_water', type: 'daily', title: 'Hydration Hero', description: 'Drink all your water glasses today', target: 1, reward: 10, icon: '💧' },
  { id: 'daily_scan', type: 'daily', title: 'Snap Happy', description: 'Scan a meal with the camera', target: 1, reward: 5, icon: '📸' },
  { id: 'daily_score_80', type: 'daily', title: 'Nutrition Star', description: 'Get a nutrition score of 80+', target: 80, reward: 15, icon: '⭐' },
];

export const WEEKLY_CHALLENGES: Challenge[] = [
  { id: 'weekly_streak_7', type: 'weekly', title: '7-Day Streak', description: 'Log food every day this week', target: 7, reward: 50, icon: '🔥' },
  { id: 'weekly_meals_21', type: 'weekly', title: 'Full Tracker', description: 'Log 21 meals this week (3/day)', target: 21, reward: 40, icon: '📋' },
  { id: 'weekly_water_7', type: 'weekly', title: 'Water Week', description: 'Hit water goal every day this week', target: 7, reward: 35, icon: '🌊' },
  { id: 'weekly_healthy_5', type: 'weekly', title: 'Healthy 5', description: 'Get 5 "great" meal scores this week', target: 5, reward: 45, icon: '🥗' },
];

export const MONTHLY_CHALLENGES: Challenge[] = [
  { id: 'monthly_streak_30', type: 'monthly', title: '30-Day Warrior', description: 'Maintain a 30-day logging streak', target: 30, reward: 200, icon: '🏆' },
  { id: 'monthly_meals_90', type: 'monthly', title: 'Dedication', description: 'Log 90 meals this month', target: 90, reward: 150, icon: '💪' },
  { id: 'monthly_avg_score', type: 'monthly', title: 'Balanced Month', description: 'Average nutrition score of 75+', target: 75, reward: 175, icon: '⚖️' },
];

export const ALL_TIME_CHALLENGES: Challenge[] = [
  { id: 'all_100_meals', type: 'all_time', title: 'Century Club', description: 'Log 100 meals total', target: 100, reward: 100, icon: '💯' },
  { id: 'all_500_meals', type: 'all_time', title: 'Meal Master', description: 'Log 500 meals total', target: 500, reward: 300, icon: '🎖️' },
  { id: 'all_1000_meals', type: 'all_time', title: 'Legendary Logger', description: 'Log 1,000 meals total', target: 1000, reward: 500, icon: '👑' },
  { id: 'all_level_10', type: 'all_time', title: 'Chester Lv.10', description: 'Get Chester to level 10', target: 10, reward: 75, icon: '🐕' },
  { id: 'all_level_25', type: 'all_time', title: 'Chester Lv.25', description: 'Get Chester to level 25', target: 25, reward: 200, icon: '🦮' },
  { id: 'all_level_50', type: 'all_time', title: 'Golden Chester', description: 'Get Chester to level 50', target: 50, reward: 500, icon: '👑🐕‍🦺' },
];

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function initChallengeProgress(challenges: Challenge[]): ChallengeProgress[] {
  return challenges.map(c => ({ challengeId: c.id, progress: 0, completed: false, coinsClaimed: false }));
}

export async function getChallengesState(): Promise<ChallengesState> {
  const data = await AsyncStorage.getItem(KEYS.CHALLENGES);
  const today = getTodayKey();
  const weekStart = getWeekStart();
  const monthKey = getMonthKey();

  if (data) {
    const state: ChallengesState = JSON.parse(data);
    let changed = false;

    // Reset daily if new day
    if (state.date !== today) {
      state.date = today;
      state.daily = initChallengeProgress(DAILY_CHALLENGES);
      changed = true;
    }
    // Reset weekly if new week
    if (state.weekStart !== weekStart) {
      state.weekStart = weekStart;
      state.weekly = initChallengeProgress(WEEKLY_CHALLENGES);
      changed = true;
    }
    // Reset monthly if new month
    if (state.monthKey !== monthKey) {
      state.monthKey = monthKey;
      state.monthly = initChallengeProgress(MONTHLY_CHALLENGES);
      changed = true;
    }
    // All-time never resets, but ensure all challenges exist
    const existingAllTimeIds = new Set(state.allTime.map(a => a.challengeId));
    for (const c of ALL_TIME_CHALLENGES) {
      if (!existingAllTimeIds.has(c.id)) {
        state.allTime.push({ challengeId: c.id, progress: 0, completed: false, coinsClaimed: false });
        changed = true;
      }
    }

    if (changed) await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(state));
    return state;
  }

  const state: ChallengesState = {
    date: today,
    weekStart,
    monthKey,
    daily: initChallengeProgress(DAILY_CHALLENGES),
    weekly: initChallengeProgress(WEEKLY_CHALLENGES),
    monthly: initChallengeProgress(MONTHLY_CHALLENGES),
    allTime: initChallengeProgress(ALL_TIME_CHALLENGES),
    totalCoinsEarned: 0,
  };
  await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(state));
  return state;
}

export async function updateChallengeProgress(challengeId: string, progress: number): Promise<void> {
  const state = await getChallengesState();
  const allLists = [state.daily, state.weekly, state.monthly, state.allTime];
  const allChallenges = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES, ...MONTHLY_CHALLENGES, ...ALL_TIME_CHALLENGES];

  for (const list of allLists) {
    const cp = list.find(c => c.challengeId === challengeId);
    if (cp) {
      cp.progress = progress;
      const challenge = allChallenges.find(c => c.id === challengeId);
      if (challenge && progress >= challenge.target && !cp.completed) {
        cp.completed = true;
        cp.completedAt = Date.now();
      }
      break;
    }
  }
  await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(state));
}

export async function claimChallengeReward(challengeId: string): Promise<number> {
  const state = await getChallengesState();
  const allLists = [state.daily, state.weekly, state.monthly, state.allTime];
  const allChallenges = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES, ...MONTHLY_CHALLENGES, ...ALL_TIME_CHALLENGES];

  for (const list of allLists) {
    const cp = list.find(c => c.challengeId === challengeId);
    if (cp && cp.completed && !cp.coinsClaimed) {
      const challenge = allChallenges.find(c => c.id === challengeId);
      if (challenge) {
        cp.coinsClaimed = true;
        state.totalCoinsEarned += challenge.reward;
        await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(state));
        const coinsAdded = await addCoins(challenge.reward);
        return coinsAdded;
      }
    }
  }
  return 0;
}

// Refresh challenge progress based on current data
export async function refreshChallengeProgress(): Promise<void> {
  const state = await getChallengesState();
  const today = getTodayKey();
  const todayLog = await getDailyLog(today);
  const waterLog = await getWaterLog(today);
  const profile = await getProfile();

  // Daily challenges
  const meals = todayLog.items.length;
  const scans = todayLog.items.filter(i => i.source === 'ai_scan').length;
  const score = calculateNutritionScore(todayLog, profile.goals);

  for (const cp of state.daily) {
    if (cp.challengeId === 'daily_log_3') cp.progress = meals;
    if (cp.challengeId === 'daily_water') cp.progress = waterLog.goalReached ? 1 : 0;
    if (cp.challengeId === 'daily_scan') cp.progress = Math.min(scans, 1);
    if (cp.challengeId === 'daily_score_80') cp.progress = score;

    const challenge = DAILY_CHALLENGES.find(c => c.id === cp.challengeId);
    if (challenge && cp.progress >= challenge.target && !cp.completed) {
      cp.completed = true;
      cp.completedAt = Date.now();
    }
  }

  // Weekly challenges
  const weekLogs = await getWeekLogs();
  const weekMeals = weekLogs.reduce((s, l) => s + l.items.length, 0);
  const daysLogged = weekLogs.filter(l => l.items.length > 0).length;
  let weekWaterDays = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const wl = await getWaterLog(d);
    if (wl.goalReached) weekWaterDays++;
  }
  const weekGreatMeals = weekLogs.reduce((s, l) => {
    // Count meals that would score "great" (high protein, reasonable cals)
    return s + l.items.filter(item => item.protein > 15 && item.calories < 600).length;
  }, 0);

  for (const cp of state.weekly) {
    if (cp.challengeId === 'weekly_streak_7') cp.progress = daysLogged;
    if (cp.challengeId === 'weekly_meals_21') cp.progress = weekMeals;
    if (cp.challengeId === 'weekly_water_7') cp.progress = weekWaterDays;
    if (cp.challengeId === 'weekly_healthy_5') cp.progress = weekGreatMeals;

    const challenge = WEEKLY_CHALLENGES.find(c => c.id === cp.challengeId);
    if (challenge && cp.progress >= challenge.target && !cp.completed) {
      cp.completed = true;
      cp.completedAt = Date.now();
    }
  }

  // Monthly - streak based
  for (const cp of state.monthly) {
    if (cp.challengeId === 'monthly_streak_30') cp.progress = profile.chester.streak;
    if (cp.challengeId === 'monthly_meals_90') cp.progress = weekMeals * 4; // approximate
    if (cp.challengeId === 'monthly_avg_score') cp.progress = score; // today's score as proxy

    const challenge = MONTHLY_CHALLENGES.find(c => c.id === cp.challengeId);
    if (challenge && cp.progress >= challenge.target && !cp.completed) {
      cp.completed = true;
      cp.completedAt = Date.now();
    }
  }

  // All-time
  const totalMeals = await getTotalMealsLogged();
  for (const cp of state.allTime) {
    if (cp.challengeId === 'all_100_meals') cp.progress = totalMeals;
    if (cp.challengeId === 'all_500_meals') cp.progress = totalMeals;
    if (cp.challengeId === 'all_1000_meals') cp.progress = totalMeals;
    if (cp.challengeId === 'all_level_10') cp.progress = profile.chester.level;
    if (cp.challengeId === 'all_level_25') cp.progress = profile.chester.level;
    if (cp.challengeId === 'all_level_50') cp.progress = profile.chester.level;

    const challenge = ALL_TIME_CHALLENGES.find(c => c.id === cp.challengeId);
    if (challenge && cp.progress >= challenge.target && !cp.completed) {
      cp.completed = true;
      cp.completedAt = Date.now();
    }
  }

  await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(state));
  syncChallengesBackground();
}

// ─── Onboarding ───

export async function isOnboardingComplete(): Promise<boolean> {
  const profile = await getProfile();
  return profile.onboardingComplete;
}

export async function completeOnboarding(): Promise<void> {
  const profile = await getProfile();
  profile.onboardingComplete = true;
  await saveProfile(profile);
}

// ─── Recent Foods ───

const RECENT_KEY = 'recent_foods';

export async function getRecentFoods(): Promise<FoodItem[]> {
  const data = await AsyncStorage.getItem(RECENT_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addRecentFood(item: FoodItem): Promise<void> {
  const recents = await getRecentFoods();
  const filtered = recents.filter(r => r.name !== item.name);
  filtered.unshift(item);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 20)));
}

// ─── Meal Plans ───

export async function saveMealPlan(plan: MealPlan): Promise<void> {
  await AsyncStorage.setItem(KEYS.MEAL_PLAN, JSON.stringify(plan));

  // Award first_meal_plan achievement if not yet earned
  const { awardAchievementById } = await import('./achievementChecker');
  const profile = await getProfile();
  const achievement = awardAchievementById('first_meal_plan', profile.chester.achievements);
  if (achievement) {
    profile.chester.achievements.push(achievement.id);
    if (achievement.coinReward > 0) {
      profile.chester.coins += profile.isPremiumMax ? achievement.coinReward * 2 : achievement.coinReward;
    }
    await saveProfile(profile);
    await queuePendingAchievements([achievement]);
  }
}

export async function getMealPlan(): Promise<MealPlan | null> {
  const data = await AsyncStorage.getItem(KEYS.MEAL_PLAN);
  return data ? JSON.parse(data) : null;
}

// ─── Weight Tracking ───

export interface WeightEntry {
  date: string;
  weight: number;
  unit: 'kg' | 'lbs';
}

export async function addWeightEntry(weight: number, unit: 'kg' | 'lbs' = 'kg'): Promise<void> {
  const profile = await getProfile();
  const today = getTodayKey();

  // Remove existing entry for today if any
  profile.weightHistory = profile.weightHistory.filter(e => e.date !== today);
  profile.weightHistory.push({ date: today, weight, unit });

  // Sort by date descending
  profile.weightHistory.sort((a, b) => b.date.localeCompare(a.date));

  await saveProfile(profile);
}

export async function getWeightHistory(): Promise<{ date: string; weight: number; unit: 'kg' | 'lbs' }[]> {
  const profile = await getProfile();
  return profile.weightHistory.sort((a, b) => a.date.localeCompare(b.date));
}

export async function deleteWeightEntry(date: string): Promise<void> {
  const profile = await getProfile();
  profile.weightHistory = profile.weightHistory.filter(e => e.date !== date);
  await saveProfile(profile);
}

// ─── Settings / Preferences ───

const SETTINGS_KEY = 'app_settings';

export interface AppSettings {
  mealReminders: boolean;
  waterReminders: boolean;
  streakWarnings: boolean;
  weightUnit: 'kg' | 'lbs';
  reminderTimes: {
    breakfast: string; // HH:MM
    lunch: string;
    dinner: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  mealReminders: true,
  waterReminders: true,
  streakWarnings: true,
  weightUnit: 'kg',
  reminderTimes: {
    breakfast: '08:00',
    lunch: '12:00',
    dinner: '18:00',
  },
};

export async function getSettings(): Promise<AppSettings> {
  const data = await AsyncStorage.getItem(SETTINGS_KEY);
  if (data) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  smartSync({ type: 'settings' }).catch(() => {});
}

// ─── Data Export ───

export async function exportAllData(): Promise<string> {
  const profile = await getProfile();
  const settings = await getSettings();
  const recentFoods = await getRecentFoods();
  const mealPlan = await getMealPlan();
  const challenges = await getChallengesState();

  // Gather all food logs
  const keys = await AsyncStorage.getAllKeys();
  const logKeys = keys.filter(k => k.startsWith(KEYS.LOG_PREFIX));
  const waterKeys = keys.filter(k => k.startsWith(KEYS.WATER_PREFIX));

  const foodLogs: Record<string, DailyLog> = {};
  for (const key of logKeys) {
    const data = await AsyncStorage.getItem(key);
    if (data) foodLogs[key.replace(KEYS.LOG_PREFIX, '')] = JSON.parse(data);
  }

  const waterLogs: Record<string, WaterLog> = {};
  for (const key of waterKeys) {
    const data = await AsyncStorage.getItem(key);
    if (data) waterLogs[key.replace(KEYS.WATER_PREFIX, '')] = JSON.parse(data);
  }

  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    profile,
    settings,
    foodLogs,
    waterLogs,
    recentFoods,
    mealPlan,
    challenges,
  };

  return JSON.stringify(exportData, null, 2);
}
