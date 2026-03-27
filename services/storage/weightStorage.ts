import { getTodayKey } from './keys';
import { getProfile, saveProfile } from './profileStorage';

export interface WeightEntry {
  date: string;
  weight: number;
  unit: 'kg' | 'lbs';
}

export async function addWeightEntry(weight: number, unit: 'kg' | 'lbs' = 'kg'): Promise<void> {
  const profile = await getProfile();
  const today = getTodayKey();

  profile.weightHistory = profile.weightHistory.filter(e => e.date !== today);
  profile.weightHistory.push({ date: today, weight, unit });
  profile.weightHistory.sort((a, b) => b.date.localeCompare(a.date));

  await saveProfile(profile);
}

export async function getWeightHistory(): Promise<WeightEntry[]> {
  const profile = await getProfile();
  return profile.weightHistory.sort((a, b) => a.date.localeCompare(b.date));
}

export async function deleteWeightEntry(date: string): Promise<void> {
  const profile = await getProfile();
  profile.weightHistory = profile.weightHistory.filter(e => e.date !== date);
  await saveProfile(profile);
}
