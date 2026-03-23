import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, DailyLog, UserProfile, ChesterState, UserGoals } from '../types';

const KEYS = {
  PROFILE: 'user_profile',
  LOG_PREFIX: 'food_log_',
  ONBOARDING: 'onboarding_complete',
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
};

export async function getProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(KEYS.PROFILE);
  if (data) return JSON.parse(data);
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

// ─── Chester ───

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

  // Award XP based on food quality
  const xpMap: Record<string, number> = { great: 20, good: 15, okay: 10, poor: 5 };
  chester.xp += xpMap[foodScore] || 10;

  // Level up every 100 XP
  while (chester.xp >= chester.level * 100) {
    chester.xp -= chester.level * 100;
    chester.level += 1;
  }

  // Set mood based on food score
  const moodMap: Record<string, ChesterState['mood']> = {
    great: 'excited', good: 'happy', okay: 'neutral', poor: 'neutral',
  };
  chester.mood = moodMap[foodScore] || 'happy';

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
  // Keep unique by name, max 20
  const filtered = recents.filter(r => r.name !== item.name);
  filtered.unshift(item);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 20)));
}
