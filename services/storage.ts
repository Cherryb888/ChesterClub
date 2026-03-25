import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, DailyLog, UserProfile, ChesterState, UserGoals, ChesterLifeStage, MealPlan, WaterLog, Challenge, ChallengeProgress, ChallengesState, ShopItem, ShopState, OwnedItem } from '../types';

const KEYS = {
  PROFILE: 'user_profile',
  LOG_PREFIX: 'food_log_',
  ONBOARDING: 'onboarding_complete',
  MEAL_PLAN: 'current_meal_plan',
  WATER_PREFIX: 'water_log_',
  CHALLENGES: 'challenges_state',
  SHOP: 'shop_state',
};

// ─── Profile ───

const DEFAULT_GOALS: UserGoals = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 200,
  dailyFat: 65,
  dailyWaterGlasses: 8,
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
  equippedOutfit: null,
  equippedAccessory: null,
};

export async function getProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(KEYS.PROFILE);
  if (data) {
    const profile = JSON.parse(data);
    // Migrate old profiles missing new fields
    if (profile.chester.health === undefined) profile.chester.health = 70;
    if (!profile.chester.achievements) profile.chester.achievements = [];
    if (profile.chester.coins === undefined) profile.chester.coins = 0;
    if (profile.goals.dailyWaterGlasses === undefined) profile.goals.dailyWaterGlasses = 8;
    if (profile.isPremiumMax === undefined) profile.isPremiumMax = false;
    if (profile.chester.previousStreak === undefined) profile.chester.previousStreak = 0;
    if (profile.chester.equippedOutfit === undefined) profile.chester.equippedOutfit = null;
    if (profile.chester.equippedAccessory === undefined) profile.chester.equippedAccessory = null;
    return profile;
  }
  const profile: UserProfile = {
    uid: 'local_user',
    email: '',
    displayName: 'Friend',
    goals: DEFAULT_GOALS,
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

  // Check achievements
  const newAchievements = [...chester.achievements];
  if (!newAchievements.includes('first_scan')) newAchievements.push('first_scan');
  if (chester.streak >= 7 && !newAchievements.includes('streak_7')) newAchievements.push('streak_7');
  if (chester.streak >= 30 && !newAchievements.includes('streak_30')) newAchievements.push('streak_30');
  if (chester.streak >= 60 && !newAchievements.includes('streak_60')) newAchievements.push('streak_60');
  if (chester.streak >= 90 && !newAchievements.includes('streak_90')) newAchievements.push('streak_90');
  if (chester.level >= 6 && !newAchievements.includes('young_dog')) newAchievements.push('young_dog');
  if (chester.level >= 16 && !newAchievements.includes('adult_dog')) newAchievements.push('adult_dog');
  if (chester.level >= 31 && !newAchievements.includes('champion')) newAchievements.push('champion');
  if (chester.level >= 50 && !newAchievements.includes('golden')) newAchievements.push('golden');
  chester.achievements = newAchievements;

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
      const healthLoss = (daysSince - 1) * 10;
      chester.health = Math.max(0, chester.health - healthLoss);
      chester.mood = chester.health < 30 ? 'sad' : 'hungry';
      if (chester.streak > 0) {
        chester.previousStreak = chester.streak;
        chester.streak = 0;
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
}

export async function getMealPlan(): Promise<MealPlan | null> {
  const data = await AsyncStorage.getItem(KEYS.MEAL_PLAN);
  return data ? JSON.parse(data) : null;
}

// ─── Shop ───

export const SHOP_ITEMS: ShopItem[] = [
  // Outfits
  { id: 'outfit_bandana', name: 'Red Bandana', description: 'A classic red bandana around the neck', category: 'outfit', price: 50, icon: '🎀', emoji: '🎀', rarity: 'common' },
  { id: 'outfit_sweater', name: 'Cozy Sweater', description: 'A warm knitted sweater for Chester', category: 'outfit', price: 100, icon: '🧥', emoji: '🧥', rarity: 'common' },
  { id: 'outfit_cape', name: 'Super Cape', description: 'Chester becomes a superhero!', category: 'outfit', price: 200, icon: '🦸', emoji: '🦸', rarity: 'rare' },
  { id: 'outfit_tux', name: 'Tuxedo', description: 'Fancy boy! Chester in a tux', category: 'outfit', price: 350, icon: '🤵', emoji: '🤵', rarity: 'rare' },
  { id: 'outfit_astronaut', name: 'Space Suit', description: 'Chester in space! To the moon!', category: 'outfit', price: 500, icon: '🧑‍🚀', emoji: '🚀', rarity: 'epic' },
  { id: 'outfit_king', name: 'Royal Robes', description: 'King Chester rules the club!', category: 'outfit', price: 1000, icon: '🫅', emoji: '👑', rarity: 'legendary' },

  // Accessories
  { id: 'acc_sunglasses', name: 'Cool Shades', description: 'Sunglasses for a cool pup', category: 'accessory', price: 30, icon: '🕶️', emoji: '🕶️', rarity: 'common' },
  { id: 'acc_bowtie', name: 'Bow Tie', description: 'A dapper bow tie', category: 'accessory', price: 60, icon: '🎩', emoji: '🎩', rarity: 'common' },
  { id: 'acc_flower', name: 'Flower Crown', description: 'A beautiful flower crown', category: 'accessory', price: 120, icon: '🌸', emoji: '🌸', rarity: 'rare' },
  { id: 'acc_star', name: 'Star Collar', description: 'A collar with a shining star', category: 'accessory', price: 250, icon: '⭐', emoji: '⭐', rarity: 'epic' },
  { id: 'acc_wings', name: 'Angel Wings', description: 'Chester gets angel wings!', category: 'accessory', price: 750, icon: '😇', emoji: '😇', rarity: 'legendary' },

  // Treats (consumable - health/mood boost)
  { id: 'treat_biscuit', name: 'Dog Biscuit', description: 'A tasty biscuit. Restores 15 health', category: 'treat', price: 15, icon: '🦴', emoji: '🦴', rarity: 'common', effect: { type: 'health_boost', value: 15 } },
  { id: 'treat_steak', name: 'Juicy Steak', description: 'Premium steak! Restores 30 health', category: 'treat', price: 40, icon: '🥩', emoji: '🥩', rarity: 'rare', effect: { type: 'health_boost', value: 30 } },
  { id: 'treat_cake', name: 'Pupcake', description: 'A special cake! Makes Chester excited', category: 'treat', price: 25, icon: '🧁', emoji: '🧁', rarity: 'common', effect: { type: 'mood_boost', value: 1 } },
  { id: 'treat_superfood', name: 'Superfood Bowl', description: 'Full health restore!', category: 'treat', price: 100, icon: '🥗', emoji: '🥗', rarity: 'epic', effect: { type: 'health_boost', value: 100 } },

  // Boosts (temporary effects)
  { id: 'boost_xp', name: 'XP Bone', description: '2x XP for 24 hours', category: 'boost', price: 75, icon: '✨', emoji: '✨', rarity: 'rare', effect: { type: 'xp_boost', value: 2, duration: 24 } },
  { id: 'boost_coin', name: 'Coin Magnet', description: '2x coins from challenges for 24h', category: 'boost', price: 100, icon: '🧲', emoji: '🧲', rarity: 'rare', effect: { type: 'coin_boost', value: 2, duration: 24 } },
];

export function getShopItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.id === itemId);
}

const DEFAULT_SHOP: ShopState = {
  ownedItems: [],
  equippedOutfit: null,
  equippedAccessory: null,
  activeBoosts: [],
};

export async function getShopState(): Promise<ShopState> {
  const data = await AsyncStorage.getItem(KEYS.SHOP);
  if (data) {
    const state: ShopState = JSON.parse(data);
    // Clean expired boosts
    const now = Date.now();
    state.activeBoosts = state.activeBoosts.filter(b => b.expiresAt > now);
    return state;
  }
  return { ...DEFAULT_SHOP };
}

async function saveShopState(state: ShopState): Promise<void> {
  await AsyncStorage.setItem(KEYS.SHOP, JSON.stringify(state));
}

export async function purchaseItem(itemId: string): Promise<{ success: boolean; message: string }> {
  const item = getShopItem(itemId);
  if (!item) return { success: false, message: 'Item not found' };

  const profile = await getProfile();
  const shop = await getShopState();

  // Check if already owned (non-consumables)
  if (item.category === 'outfit' || item.category === 'accessory') {
    if (shop.ownedItems.some(o => o.itemId === itemId)) {
      return { success: false, message: 'You already own this item!' };
    }
  }

  // Check coins
  if (profile.chester.coins < item.price) {
    return { success: false, message: `Not enough coins! Need ${item.price - profile.chester.coins} more.` };
  }

  // Deduct coins
  profile.chester.coins -= item.price;

  // Apply effect for consumables
  if (item.category === 'treat' && item.effect) {
    if (item.effect.type === 'health_boost') {
      profile.chester.health = Math.min(100, profile.chester.health + item.effect.value);
    }
    if (item.effect.type === 'mood_boost') {
      profile.chester.mood = 'excited';
    }
  } else if (item.category === 'boost' && item.effect?.duration) {
    shop.activeBoosts.push({
      itemId: item.id,
      expiresAt: Date.now() + item.effect.duration * 60 * 60 * 1000,
    });
  } else {
    // Outfit or accessory - add to owned
    shop.ownedItems.push({ itemId, purchasedAt: Date.now(), equipped: false });
  }

  await saveProfile(profile);
  await saveShopState(shop);
  return { success: true, message: `Purchased ${item.name}!` };
}

export async function equipItem(itemId: string): Promise<void> {
  const item = getShopItem(itemId);
  if (!item) return;

  const profile = await getProfile();
  const shop = await getShopState();

  if (item.category === 'outfit') {
    // Unequip current
    shop.ownedItems.forEach(o => {
      const oi = getShopItem(o.itemId);
      if (oi?.category === 'outfit') o.equipped = false;
    });
    // Equip new
    const owned = shop.ownedItems.find(o => o.itemId === itemId);
    if (owned) owned.equipped = true;
    shop.equippedOutfit = itemId;
    profile.chester.equippedOutfit = itemId;
  } else if (item.category === 'accessory') {
    shop.ownedItems.forEach(o => {
      const oi = getShopItem(o.itemId);
      if (oi?.category === 'accessory') o.equipped = false;
    });
    const owned = shop.ownedItems.find(o => o.itemId === itemId);
    if (owned) owned.equipped = true;
    shop.equippedAccessory = itemId;
    profile.chester.equippedAccessory = itemId;
  }

  await saveShopState(shop);
  await saveProfile(profile);
}

export async function unequipItem(category: 'outfit' | 'accessory'): Promise<void> {
  const profile = await getProfile();
  const shop = await getShopState();

  shop.ownedItems.forEach(o => {
    const oi = getShopItem(o.itemId);
    if (oi?.category === category) o.equipped = false;
  });

  if (category === 'outfit') {
    shop.equippedOutfit = null;
    profile.chester.equippedOutfit = null;
  } else {
    shop.equippedAccessory = null;
    profile.chester.equippedAccessory = null;
  }

  await saveShopState(shop);
  await saveProfile(profile);
}

export async function hasActiveBoost(type: string): Promise<boolean> {
  const shop = await getShopState();
  const now = Date.now();
  return shop.activeBoosts.some(b => {
    const item = getShopItem(b.itemId);
    return item?.effect?.type === type && b.expiresAt > now;
  });
}
