import { DailyLog, FoodItem, UserGoals } from '../types';

/**
 * Recalculate log totals from items. Call after adding/removing items.
 */
export function recalcLogTotals(log: DailyLog): void {
  log.totalCalories = log.items.reduce((s, i) => s + i.calories, 0);
  log.totalProtein = log.items.reduce((s, i) => s + i.protein, 0);
  log.totalCarbs = log.items.reduce((s, i) => s + i.carbs, 0);
  log.totalFat = log.items.reduce((s, i) => s + i.fat, 0);
}

/**
 * Score 0-100 based on how close daily intake is to goals.
 * Penalizes going over calorie goal.
 */
export function calculateNutritionScore(log: DailyLog, goals: UserGoals): number {
  if (log.items.length === 0) return 0;

  const calRatio = Math.min(log.totalCalories / goals.dailyCalories, 1);
  const proRatio = Math.min(log.totalProtein / goals.dailyProtein, 1);
  const carbRatio = Math.min(log.totalCarbs / goals.dailyCarbs, 1);
  const fatRatio = Math.min(log.totalFat / goals.dailyFat, 1);

  const calOver = log.totalCalories > goals.dailyCalories
    ? (log.totalCalories - goals.dailyCalories) / goals.dailyCalories
    : 0;
  const penalty = Math.min(calOver * 30, 20);

  const rawScore = ((calRatio + proRatio + carbRatio + fatRatio) / 4) * 100;
  return Math.max(0, Math.round(rawScore - penalty));
}
