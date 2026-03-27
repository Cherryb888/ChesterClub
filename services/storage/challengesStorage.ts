import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge, ChallengeProgress, ChallengesState } from '../../types';
import { smartSync } from '../syncQueue';
import { calculateNutritionScore } from '../../utils/nutrition';
import { KEYS, getTodayKey } from './keys';
import { getProfile } from './profileStorage';
import { getDailyLog, getWeekLogs, getTotalMealsLogged } from './foodLogStorage';
import { getWaterLog } from './waterStorage';
import { addCoins } from './chesterStorage';

// ─── Challenge Definitions ───

export const DAILY_CHALLENGES: Challenge[] = [
  { id: 'daily_log_3',    type: 'daily',  title: 'Log 3 Meals',     description: 'Log at least 3 meals today',         target: 3,  reward: 10, icon: '🍽️' },
  { id: 'daily_water',    type: 'daily',  title: 'Hydration Hero',  description: 'Drink all your water glasses today',  target: 1,  reward: 10, icon: '💧' },
  { id: 'daily_scan',     type: 'daily',  title: 'Snap Happy',      description: 'Scan a meal with the camera',        target: 1,  reward: 5,  icon: '📸' },
  { id: 'daily_score_80', type: 'daily',  title: 'Nutrition Star',  description: 'Get a nutrition score of 80+',       target: 80, reward: 15, icon: '⭐' },
];

export const WEEKLY_CHALLENGES: Challenge[] = [
  { id: 'weekly_streak_7',  type: 'weekly', title: '7-Day Streak',  description: 'Log food every day this week',              target: 7,  reward: 50, icon: '🔥' },
  { id: 'weekly_meals_21',  type: 'weekly', title: 'Full Tracker',  description: 'Log 21 meals this week (3/day)',            target: 21, reward: 40, icon: '📋' },
  { id: 'weekly_water_7',   type: 'weekly', title: 'Water Week',    description: 'Hit water goal every day this week',       target: 7,  reward: 35, icon: '🌊' },
  { id: 'weekly_healthy_5', type: 'weekly', title: 'Healthy 5',     description: 'Get 5 "great" meal scores this week',      target: 5,  reward: 45, icon: '🥗' },
];

export const MONTHLY_CHALLENGES: Challenge[] = [
  { id: 'monthly_streak_30', type: 'monthly', title: '30-Day Warrior',  description: 'Maintain a 30-day logging streak',        target: 30,  reward: 200, icon: '🏆' },
  { id: 'monthly_meals_90',  type: 'monthly', title: 'Dedication',      description: 'Log 90 meals this month',                target: 90,  reward: 150, icon: '💪' },
  { id: 'monthly_avg_score', type: 'monthly', title: 'Balanced Month',  description: 'Average nutrition score of 75+',         target: 75,  reward: 175, icon: '⚖️' },
];

export const ALL_TIME_CHALLENGES: Challenge[] = [
  { id: 'all_100_meals',  type: 'all_time', title: 'Century Club',      description: 'Log 100 meals total',         target: 100,  reward: 100, icon: '💯' },
  { id: 'all_500_meals',  type: 'all_time', title: 'Meal Master',       description: 'Log 500 meals total',         target: 500,  reward: 300, icon: '🎖️' },
  { id: 'all_1000_meals', type: 'all_time', title: 'Legendary Logger',  description: 'Log 1,000 meals total',       target: 1000, reward: 500, icon: '👑' },
  { id: 'all_level_10',   type: 'all_time', title: 'Chester Lv.10',     description: 'Get Chester to level 10',     target: 10,   reward: 75,  icon: '🐕' },
  { id: 'all_level_25',   type: 'all_time', title: 'Chester Lv.25',     description: 'Get Chester to level 25',     target: 25,   reward: 200, icon: '🦮' },
  { id: 'all_level_50',   type: 'all_time', title: 'Golden Chester',    description: 'Get Chester to level 50',     target: 50,   reward: 500, icon: '👑🐕‍🦺' },
];

// ─── Helpers ───

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

// ─── State ───

export async function getChallengesState(): Promise<ChallengesState> {
  const data = await AsyncStorage.getItem(KEYS.CHALLENGES);
  const today = getTodayKey();
  const weekStart = getWeekStart();
  const monthKey = getMonthKey();

  if (data) {
    const state: ChallengesState = JSON.parse(data);
    let changed = false;

    if (state.date !== today) {
      state.date = today;
      state.daily = initChallengeProgress(DAILY_CHALLENGES);
      changed = true;
    }
    if (state.weekStart !== weekStart) {
      state.weekStart = weekStart;
      state.weekly = initChallengeProgress(WEEKLY_CHALLENGES);
      changed = true;
    }
    if (state.monthKey !== monthKey) {
      state.monthKey = monthKey;
      state.monthly = initChallengeProgress(MONTHLY_CHALLENGES);
      changed = true;
    }
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

export async function refreshChallengeProgress(): Promise<void> {
  const state = await getChallengesState();
  const today = getTodayKey();
  const todayLog = await getDailyLog(today);
  const waterLog = await getWaterLog(today);
  const profile = await getProfile();

  const meals = todayLog.items.length;
  const scans = todayLog.items.filter(i => i.source === 'ai_scan').length;
  const score = calculateNutritionScore(todayLog, profile.goals);

  for (const cp of state.daily) {
    if (cp.challengeId === 'daily_log_3')    cp.progress = meals;
    if (cp.challengeId === 'daily_water')    cp.progress = waterLog.goalReached ? 1 : 0;
    if (cp.challengeId === 'daily_scan')     cp.progress = Math.min(scans, 1);
    if (cp.challengeId === 'daily_score_80') cp.progress = score;

    const challenge = DAILY_CHALLENGES.find(c => c.id === cp.challengeId);
    if (challenge && cp.progress >= challenge.target && !cp.completed) {
      cp.completed = true;
      cp.completedAt = Date.now();
    }
  }

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
    return s + l.items.filter(item => item.protein > 15 && item.calories < 600).length;
  }, 0);

  for (const cp of state.weekly) {
    if (cp.challengeId === 'weekly_streak_7')  cp.progress = daysLogged;
    if (cp.challengeId === 'weekly_meals_21')  cp.progress = weekMeals;
    if (cp.challengeId === 'weekly_water_7')   cp.progress = weekWaterDays;
    if (cp.challengeId === 'weekly_healthy_5') cp.progress = weekGreatMeals;

    const challenge = WEEKLY_CHALLENGES.find(c => c.id === cp.challengeId);
    if (challenge && cp.progress >= challenge.target && !cp.completed) {
      cp.completed = true;
      cp.completedAt = Date.now();
    }
  }

  for (const cp of state.monthly) {
    if (cp.challengeId === 'monthly_streak_30') cp.progress = profile.chester.streak;
    if (cp.challengeId === 'monthly_meals_90')  cp.progress = weekMeals * 4;
    if (cp.challengeId === 'monthly_avg_score') cp.progress = score;

    const challenge = MONTHLY_CHALLENGES.find(c => c.id === cp.challengeId);
    if (challenge && cp.progress >= challenge.target && !cp.completed) {
      cp.completed = true;
      cp.completedAt = Date.now();
    }
  }

  const totalMeals = await getTotalMealsLogged();
  for (const cp of state.allTime) {
    if (cp.challengeId === 'all_100_meals')  cp.progress = totalMeals;
    if (cp.challengeId === 'all_500_meals')  cp.progress = totalMeals;
    if (cp.challengeId === 'all_1000_meals') cp.progress = totalMeals;
    if (cp.challengeId === 'all_level_10')   cp.progress = profile.chester.level;
    if (cp.challengeId === 'all_level_25')   cp.progress = profile.chester.level;
    if (cp.challengeId === 'all_level_50')   cp.progress = profile.chester.level;

    const challenge = ALL_TIME_CHALLENGES.find(c => c.id === cp.challengeId);
    if (challenge && cp.progress >= challenge.target && !cp.completed) {
      cp.completed = true;
      cp.completedAt = Date.now();
    }
  }

  await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(state));
  smartSync({ type: 'challenges' }).catch(() => {});
}
