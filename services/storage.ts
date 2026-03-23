import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, DailyLog, UserProfile, ChesterState, UserGoals, ChesterLifeStage, MealPlan } from '../types';

const KEYS = {
  PROFILE: 'user_profile',
  LOG_PREFIX: 'food_log_',
  ONBOARDING: 'onboarding_complete',
  MEAL_PLAN: 'current_meal_plan',
};

// ─── Profile ───

const DEFAULT_GOALS: UserGoals = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 200,
  dailyFat: 65,
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
};

export async function getProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(KEYS.PROFILE);
  if (data) {
    const profile = JSON.parse(data);
    // Migrate old profiles missing new fields
    if (profile.chester.health === undefined) profile.chester.health = 70;
    if (!profile.chester.achievements) profile.chester.achievements = [];
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

// Life stages based on level
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

// Streak multiplier for XP
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

export async function feedChester(foodScore: string): Promise<ChesterState> {
  const profile = await getProfile();
  const today = new Date().toISOString().split('T')[0];
  const chester = profile.chester;

  // Update streak
  if (chester.lastFedDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    chester.streak = chester.lastFedDate === yesterday ? chester.streak + 1 : 1;
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

// Decay mechanic: call this when app opens to check if Chester should lose health
export async function checkChesterDecay(): Promise<ChesterState> {
  const profile = await getProfile();
  const chester = profile.chester;
  const today = new Date().toISOString().split('T')[0];

  if (chester.lastFedDate && chester.lastFedDate !== today) {
    const lastFed = new Date(chester.lastFedDate).getTime();
    const daysSince = Math.floor((Date.now() - lastFed) / 86400000);

    if (daysSince >= 2) {
      // Lose health for each day missed beyond 1
      const healthLoss = (daysSince - 1) * 10;
      chester.health = Math.max(0, chester.health - healthLoss);
      chester.mood = chester.health < 30 ? 'sad' : 'hungry';
    }
  }

  profile.chester = chester;
  await saveProfile(profile);
  return chester;
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

// Get logs for a specific month (for calendar view)
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
