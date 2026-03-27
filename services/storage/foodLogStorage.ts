import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, DailyLog } from '../../types';
import { smartSync } from '../syncQueue';
import { recalcLogTotals } from '../../utils/nutrition';
import { KEYS, getTodayKey } from './keys';

function getLogKey(date: string): string {
  return KEYS.LOG_PREFIX + date;
}

// ─── Daily Log ───

export async function getDailyLog(date: string): Promise<DailyLog> {
  const data = await AsyncStorage.getItem(getLogKey(date));
  if (data) return JSON.parse(data);
  return { date, items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
}

export async function addFoodToLog(item: FoodItem, date?: string): Promise<DailyLog> {
  const key = date || getTodayKey();
  const log = await getDailyLog(key);
  log.items.push(item);
  recalcLogTotals(log);
  await AsyncStorage.setItem(getLogKey(key), JSON.stringify(log));
  smartSync({ type: 'foodLog', date: key }).catch(() => {});
  return log;
}

export async function removeFoodFromLog(itemId: string, date?: string): Promise<DailyLog> {
  const key = date || getTodayKey();
  const log = await getDailyLog(key);
  log.items = log.items.filter(i => i.id !== itemId);
  recalcLogTotals(log);
  await AsyncStorage.setItem(getLogKey(key), JSON.stringify(log));
  smartSync({ type: 'foodLog', date: key }).catch(() => {});
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
