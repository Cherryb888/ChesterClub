import { ACHIEVEMENTS, AchievementDefinition } from '../constants/achievements';
import { UserProfile, DailyLog, WaterLog } from '../types';

// ─── Achievement Checker ───
//
// Evaluates all achievement conditions and returns newly unlocked IDs.
// Called after food logging, water logging, and other key events.
// Does NOT modify profile — caller is responsible for updating achievements and coins.

export interface AchievementCheckContext {
  profile: UserProfile;
  todayLog: DailyLog | null;
  waterLog: WaterLog | null;
  totalScans: number; // lifetime count of food items logged
  nutritionScore: number;
}

type ConditionFn = (ctx: AchievementCheckContext) => boolean;

// ─── Condition Registry ───
// Maps achievement IDs to their unlock conditions.

const CONDITIONS: Record<string, ConditionFn> = {
  // Getting Started
  first_scan: (ctx) => (ctx.todayLog?.items.length || 0) > 0 || ctx.totalScans > 0,
  first_water: (ctx) => (ctx.waterLog?.glasses || 0) > 0,
  first_meal_plan: () => false, // checked separately when meal plan is generated
  log_3_meals: (ctx) => {
    if (!ctx.todayLog) return false;
    const types = new Set(ctx.todayLog.items.map(i => i.mealType));
    return types.size >= 3;
  },

  // Streaks
  streak_7: (ctx) => ctx.profile.chester.streak >= 7,
  streak_14: (ctx) => ctx.profile.chester.streak >= 14,
  streak_30: (ctx) => ctx.profile.chester.streak >= 30,
  streak_60: (ctx) => ctx.profile.chester.streak >= 60,
  streak_90: (ctx) => ctx.profile.chester.streak >= 90,

  // Chester Life Stages
  young_dog: (ctx) => ctx.profile.chester.level >= 6,
  adult_dog: (ctx) => ctx.profile.chester.level >= 16,
  champion: (ctx) => ctx.profile.chester.level >= 31,
  golden: (ctx) => ctx.profile.chester.level >= 50,

  // Nutrition
  perfect_day: (ctx) => {
    if (!ctx.todayLog || ctx.profile.goals.dailyCalories === 0) return false;
    const ratio = ctx.todayLog.totalCalories / ctx.profile.goals.dailyCalories;
    return ratio >= 0.95 && ratio <= 1.05;
  },
  protein_king: () => false, // requires multi-day tracking — checked via storage counter
  score_90: (ctx) => ctx.nutritionScore >= 90,
  score_100: (ctx) => ctx.nutritionScore >= 100,

  // Water
  water_streak_3: () => false, // requires multi-day tracking — checked via storage counter
  water_streak_7: () => false, // requires multi-day tracking — checked via storage counter

  // Scanning milestones
  scan_10: (ctx) => ctx.totalScans >= 10,
  scan_50: (ctx) => ctx.totalScans >= 50,
  scan_100: (ctx) => ctx.totalScans >= 100,

  // Coins
  coins_100: (ctx) => ctx.profile.chester.coins >= 100,
  coins_500: (ctx) => ctx.profile.chester.coins >= 500,
  coins_1000: (ctx) => ctx.profile.chester.coins >= 1000,

  // Weight
  first_weight: (ctx) => ctx.profile.weightHistory.length > 0,
};

/**
 * Check all achievements and return any newly unlocked ones.
 * Does not modify the profile — the caller should:
 *  1. Add returned IDs to chester.achievements
 *  2. Award coinReward for each
 */
export function checkAchievements(ctx: AchievementCheckContext): AchievementDefinition[] {
  const unlocked = ctx.profile.chester.achievements;
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (unlocked.includes(achievement.id)) continue;

    // Check condition
    const condition = CONDITIONS[achievement.id];
    if (condition && condition(ctx)) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

/**
 * Manually award a specific achievement by ID (e.g., first_meal_plan).
 * Returns the achievement definition if newly unlocked, null if already owned.
 */
export function awardAchievementById(
  achievementId: string,
  currentAchievements: string[]
): AchievementDefinition | null {
  if (currentAchievements.includes(achievementId)) return null;
  return ACHIEVEMENTS.find(a => a.id === achievementId) || null;
}
