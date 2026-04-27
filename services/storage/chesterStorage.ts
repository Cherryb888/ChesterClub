import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChesterState, ChesterLifeStage } from '../../types';
import { AchievementDefinition } from '../../constants/achievements';
import { StreakMilestone, getMilestoneForDay } from '../../constants/streakRewards';
import { checkAchievements, AchievementCheckContext } from '../achievementChecker';
import { calculateNutritionScore } from '../../utils/nutrition';
import { emitChesterEvent } from '../chesterEvents';
import { KEYS, getTodayKey } from './keys';
import { getProfile, saveProfile } from './profileStorage';
import { getDailyLog } from './foodLogStorage';
import { getWaterLog } from './waterStorage';

// ─── Life Stage ───

export function getChesterLifeStage(level: number): ChesterLifeStage {
  if (level >= 50) return 'golden';
  if (level >= 31) return 'champion';
  if (level >= 16) return 'adult';
  if (level >= 6) return 'young';
  return 'puppy';
}

export const LIFE_STAGE_INFO: Record<ChesterLifeStage, { name: string; emoji: string; description: string; color: string }> = {
  puppy:    { name: 'Puppy',         emoji: '🐶',      description: 'Tiny, clumsy, always hungry', color: '#FFB380' },
  young:    { name: 'Young Dog',     emoji: '🐕',      description: 'Energetic & playful',         color: '#FF8C42' },
  adult:    { name: 'Adult Dog',     emoji: '🦮',      description: 'Strong & confident',          color: '#E07030' },
  champion: { name: 'Champion Dog',  emoji: '🏆🐕',    description: 'Muscular, wears a medal',     color: '#FFD700' },
  golden:   { name: 'Golden Chester', emoji: '👑🐕‍🦺', description: 'Peak health, legendary!',     color: '#FFD700' },
};

// ─── Chester CRUD ───

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
  const finalAmount = profile.isPremiumMax ? amount * 2 : amount;
  profile.chester.coins += finalAmount;
  await saveProfile(profile);
  return finalAmount;
}

// ─── Scan Counter ───

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

// ─── Achievement Queue ───

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

export async function queuePendingAchievements(achievements: AchievementDefinition[]): Promise<void> {
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
  if (profile.chester.streakShieldActive) return false;
  profile.chester.streakShieldActive = true;
  await saveProfile(profile);
  return true;
}

export function isStreakShieldActive(chester: ChesterState): boolean {
  return chester.streakShieldActive;
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
  const today = getTodayKey();
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
  chester.lastFedDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
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
  const keys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const [logs, waters] = await Promise.all([
    Promise.all(keys.map(k => getDailyLog(k))),
    Promise.all(keys.map(k => getWaterLog(k))),
  ]);

  let totalMeals = 0;
  let totalCalories = 0;
  let totalScore = 0;
  let waterGoalDays = 0;
  let daysLogged = 0;

  for (let i = 0; i < 7; i++) {
    const log = logs[i];
    const water = waters[i];

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

// ─── Feed Chester ───

function getStreakMultiplier(streak: number): number {
  if (streak >= 60) return 5;
  if (streak >= 30) return 3;
  if (streak >= 7) return 2;
  return 1;
}

export async function feedChester(foodScore: string): Promise<ChesterState> {
  const profile = await getProfile();
  const today = getTodayKey();
  const chester = profile.chester;
  const startLevel = chester.level;
  const startStreak = chester.streak;
  let triggeredMilestone: StreakMilestone | null = null;

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

    const milestone = getMilestoneForDay(chester.streak);
    if (milestone) {
      chester.coins += profile.isPremiumMax ? milestone.coins * 2 : milestone.coins;
      await queueMilestone(milestone);
      triggeredMilestone = milestone;
    }
  }

  // Award XP with streak multiplier
  const xpMap: Record<string, number> = { great: 20, good: 15, okay: 10, poor: 5 };
  const baseXp = xpMap[foodScore] || 10;
  const multiplier = getStreakMultiplier(chester.streak);
  chester.xp += baseXp * multiplier;

  // Level up every 100 XP (scales with level)
  while (chester.xp >= chester.level * 100) {
    chester.xp -= chester.level * 100;
    chester.level += 1;
  }

  // Health
  const healthMap: Record<string, number> = { great: 8, good: 5, okay: 2, poor: -3 };
  chester.health = Math.min(100, Math.max(0, chester.health + (healthMap[foodScore] || 0)));

  // Mood
  if (chester.health < 30) {
    chester.mood = 'sad';
  } else if (foodScore === 'great') {
    chester.mood = 'excited';
  } else if (foodScore === 'good') {
    chester.mood = 'happy';
  } else {
    chester.mood = 'neutral';
  }

  // Achievements
  const totalScans = await incrementTotalScans();
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

  // Emit reaction events. Order matters for queue UX: meal first, then
  // streak milestone, then per-achievement pops.
  emitChesterEvent({
    type: 'chester_fed',
    score: (foodScore === 'great' || foodScore === 'good' || foodScore === 'okay' || foodScore === 'poor') ? foodScore : 'good',
    newLevel: chester.level,
    leveledUp: chester.level > startLevel,
    newStreak: chester.streak,
    streakIncreased: chester.streak > startStreak,
  });
  if (triggeredMilestone) {
    emitChesterEvent({ type: 'streak_milestone', milestone: triggeredMilestone });
  }
  for (const achievement of newlyUnlocked) {
    emitChesterEvent({ type: 'achievement_unlocked', achievement });
  }

  return chester;
}

// ─── Chester Decay ───

export async function checkChesterDecay(): Promise<ChesterState> {
  const profile = await getProfile();
  const chester = profile.chester;
  const today = getTodayKey();

  if (chester.lastFedDate && chester.lastFedDate !== today) {
    const lastFed = new Date(chester.lastFedDate).getTime();
    const daysSince = Math.floor((Date.now() - lastFed) / 86400000);

    if (daysSince >= 2) {
      if (chester.streakShieldActive && daysSince === 2 && chester.streak > 0) {
        chester.streakShieldActive = false;
        chester.lastFedDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
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
