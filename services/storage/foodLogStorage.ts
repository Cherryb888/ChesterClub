import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, DailyLog } from '../../types';
import { smartSync } from '../syncQueue';
import { recalcLogTotals } from '../../utils/nutrition';
import { KEYS, getTodayKey } from './keys';

function getLogKey(date: string): string {
  return KEYS.LOG_PREFIX + date;
}

// Simple per-key lock to prevent concurrent read-modify-write races
const logLocks = new Map<string, Promise<any>>();
function withLogLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = logLocks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  logLocks.set(key, next);
  next.finally(() => { if (logLocks.get(key) === next) logLocks.delete(key); });
  return next;
}

// ─── Daily Log ───

export async function getDailyLog(date: string): Promise<DailyLog> {
  const data = await AsyncStorage.getItem(getLogKey(date));
  if (data) {
    try { return JSON.parse(data); }
    catch { /* fall through to default */ }
  }
  return { date, items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
}

export function addFoodToLog(item: FoodItem, date?: string): Promise<DailyLog> {
  const key = date || getTodayKey();
  return withLogLock(key, async () => {
    const log = await getDailyLog(key);
    const updated = recalcLogTotals({ ...log, items: [...log.items, item] });
    await AsyncStorage.setItem(getLogKey(key), JSON.stringify(updated));
    smartSync({ type: 'foodLog', date: key }).catch(() => {});
    return updated;
  });
}

export function removeFoodFromLog(itemId: string, date?: string): Promise<DailyLog> {
  const key = date || getTodayKey();
  return withLogLock(key, async () => {
    const log = await getDailyLog(key);
    const updated = recalcLogTotals({ ...log, items: log.items.filter(i => i.id !== itemId) });
    await AsyncStorage.setItem(getLogKey(key), JSON.stringify(updated));
    smartSync({ type: 'foodLog', date: key }).catch(() => {});
    return updated;
  });
}

export async function getWeekLogs(): Promise<DailyLog[]> {
  const keys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toISOString().split('T')[0];
  });
  return Promise.all(keys.map(k => getDailyLog(k)));
}

export async function getMonthLogs(year: number, month: number): Promise<Record<string, DailyLog>> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
  );
  const allLogs = await Promise.all(dates.map(d => getDailyLog(d)));

  const logs: Record<string, DailyLog> = {};
  for (let i = 0; i < dates.length; i++) {
    if (allLogs[i].items.length > 0) {
      logs[dates[i]] = allLogs[i];
    }
  }
  return logs;
}

export async function getTotalMealsLogged(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const logKeys = keys.filter(k => k.startsWith(KEYS.LOG_PREFIX));
  if (logKeys.length === 0) return 0;
  const entries = await AsyncStorage.multiGet(logKeys);
  let total = 0;
  for (const [, data] of entries) {
    if (data) {
      try {
        const log: DailyLog = JSON.parse(data);
        total += log.items.length;
      } catch {
        // Skip corrupted entries
      }
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
