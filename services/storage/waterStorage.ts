import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLog } from '../../types';
import { smartSync } from '../syncQueue';
import { KEYS, getTodayKey } from './keys';
import { getProfile } from './profileStorage';

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

  if (!log.goalReached) {
    log.glasses += 1;
    if (log.glasses >= goal) {
      log.goalReached = true;
    }
  }
  await AsyncStorage.setItem(KEYS.WATER_PREFIX + key, JSON.stringify(log));
  smartSync({ type: 'waterLog', date: key }).catch(() => {});
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
  smartSync({ type: 'waterLog', date: key }).catch(() => {});
  return log;
}
