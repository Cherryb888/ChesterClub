import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyLog, WaterLog } from '../../types';
import { smartSync } from '../syncQueue';
import { KEYS } from './keys';
import { getProfile } from './profileStorage';
import { getRecentFoods, getDailyLog } from './foodLogStorage';
import { getMealPlan } from './mealPlanStorage';
import { getWaterLog } from './waterStorage';
import { getChallengesState } from './challengesStorage';

// ─── Settings ───

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

const SETTINGS_KEY = 'app_settings';

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

  return JSON.stringify({
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    profile,
    settings,
    foodLogs,
    waterLogs,
    recentFoods,
    mealPlan,
    challenges,
  }, null, 2);
}
