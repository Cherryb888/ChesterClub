import { DailyLog, FoodItem, UserGoals, DietProfile } from '../types';

// ─── Types ───

export interface MealBreakdown {
  mealType: FoodItem['mealType'];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  itemCount: number;
}

export interface NutritionRecommendation {
  macro: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'general';
  message: string;
  priority: number; // higher = shown first
}

// ─── 1. Pure log totals recalculation ───

/**
 * Returns a new DailyLog with totals recalculated from items.
 * Pure — does not mutate the input.
 */
export function recalcLogTotals(log: DailyLog): DailyLog {
  return {
    ...log,
    totalCalories: log.items.reduce((s, i) => s + i.calories, 0),
    totalProtein:  log.items.reduce((s, i) => s + i.protein, 0),
    totalCarbs:    log.items.reduce((s, i) => s + i.carbs, 0),
    totalFat:      log.items.reduce((s, i) => s + i.fat, 0),
    totalFiber:    log.items.reduce((s, i) => s + (i.fiber  ?? 0), 0),
    totalSugar:    log.items.reduce((s, i) => s + (i.sugar  ?? 0), 0),
    totalSodium:   log.items.reduce((s, i) => s + (i.sodium ?? 0), 0),
  };
}

// ─── 2. Nutrition score (0–100) ───

/**
 * Score 0–100 based on how close daily intake is to goals.
 * - Protein is weighted higher than carbs/fat for all goals.
 * - Weights shift based on fitnessGoal and dietType when DietProfile is provided.
 * - Penalises going over calories AND fat.
 * - Keto users get an additional carb-over penalty.
 */
export function calculateNutritionScore(log: DailyLog, goals: UserGoals, dietProfile?: DietProfile): number {
  if (log.items.length === 0) return 0;

  // Default weights: protein matters most
  let w = { cal: 0.30, protein: 0.35, carbs: 0.20, fat: 0.15 };

  if (dietProfile) {
    if (dietProfile.fitnessGoal === 'gain_muscle') {
      w = { cal: 0.25, protein: 0.45, carbs: 0.20, fat: 0.10 };
    } else if (dietProfile.fitnessGoal === 'lose_weight') {
      w = { cal: 0.35, protein: 0.40, carbs: 0.15, fat: 0.10 };
    } else if (dietProfile.dietType === 'keto') {
      w = { cal: 0.30, protein: 0.35, carbs: 0.05, fat: 0.30 };
    }
  }

  const calRatio  = Math.min(log.totalCalories / goals.dailyCalories, 1);
  const proRatio  = Math.min(log.totalProtein  / goals.dailyProtein,  1);
  const carbRatio = Math.min(log.totalCarbs    / goals.dailyCarbs,    1);
  const fatRatio  = Math.min(log.totalFat      / goals.dailyFat,      1);

  const rawScore = (
    calRatio  * w.cal     +
    proRatio  * w.protein +
    carbRatio * w.carbs   +
    fatRatio  * w.fat
  ) * 100;

  // Calorie over-penalty (up to –20 pts)
  const calOver = Math.max(0, (log.totalCalories - goals.dailyCalories) / goals.dailyCalories);
  const calPenalty = Math.min(calOver * 30, 20);

  // Fat over-penalty (up to –10 pts)
  const fatOver = Math.max(0, (log.totalFat - goals.dailyFat) / goals.dailyFat);
  const fatPenalty = Math.min(fatOver * 20, 10);

  // Keto carb over-penalty (up to –20 pts)
  let carbPenalty = 0;
  if (dietProfile?.dietType === 'keto') {
    const carbOver = Math.max(0, (log.totalCarbs - goals.dailyCarbs) / goals.dailyCarbs);
    carbPenalty = Math.min(carbOver * 40, 20);
  }

  return Math.max(0, Math.round(rawScore - calPenalty - fatPenalty - carbPenalty));
}

// ─── 3. Per-meal breakdown ───

/**
 * Returns calorie/macro totals broken down by meal type.
 * Only includes meal types that have at least one logged item.
 */
export function getMealBreakdown(log: DailyLog): MealBreakdown[] {
  const types: FoodItem['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack'];
  return types
    .map(mealType => {
      const items = log.items.filter(i => i.mealType === mealType);
      return {
        mealType,
        calories: items.reduce((s, i) => s + i.calories, 0),
        protein:  items.reduce((s, i) => s + i.protein, 0),
        carbs:    items.reduce((s, i) => s + i.carbs, 0),
        fat:      items.reduce((s, i) => s + i.fat, 0),
        itemCount: items.length,
      };
    })
    .filter(m => m.itemCount > 0);
}

// ─── 4. Actionable recommendations ───

/**
 * Returns prioritised, actionable nutrition recommendations based on
 * today's log vs goals and the user's diet profile.
 */
export function getNutritionRecommendations(
  log: DailyLog,
  goals: UserGoals,
  dietProfile?: DietProfile,
): NutritionRecommendation[] {
  const recs: NutritionRecommendation[] = [];

  const calRemaining  = goals.dailyCalories - log.totalCalories;
  const proRemaining  = goals.dailyProtein  - log.totalProtein;
  const fatOver       = log.totalFat - goals.dailyFat;

  // Calorie guidance
  if (calRemaining < -200) {
    recs.push({
      macro: 'calories',
      message: `You're ${Math.abs(calRemaining)} cal over goal. Keep your next meal light.`,
      priority: 90,
    });
  } else if (calRemaining > 500) {
    recs.push({
      macro: 'calories',
      message: `${calRemaining} cal remaining today — make sure you're eating enough to fuel your goals.`,
      priority: 60,
    });
  }

  // Protein gap (most important for all goals)
  if (proRemaining > 30) {
    const suggestions =
      dietProfile?.dietType === 'vegan'        ? 'tofu, tempeh, or edamame' :
      dietProfile?.dietType === 'vegetarian'   ? 'Greek yogurt, eggs, or cottage cheese' :
      dietProfile?.dietType === 'pescatarian'  ? 'salmon, tuna, or Greek yogurt' :
                                                  'chicken breast, Greek yogurt, or eggs';
    recs.push({
      macro: 'protein',
      message: `You're ${proRemaining}g short on protein. Try adding ${suggestions}.`,
      priority: 80,
    });
  }

  // Fat over-goal
  if (fatOver > goals.dailyFat * 0.2) {
    recs.push({
      macro: 'fat',
      message: `Fat is ${Math.round(fatOver)}g over goal. Choose leaner options or reduce added oils for the rest of the day.`,
      priority: 65,
    });
  }

  // Keto: carb warning when nearing limit
  if (dietProfile?.dietType === 'keto' && log.totalCarbs > goals.dailyCarbs * 0.75) {
    recs.push({
      macro: 'carbs',
      message: `You've used ${log.totalCarbs}g of your ${goals.dailyCarbs}g carb limit. Stick to leafy greens and proteins for the rest of the day.`,
      priority: 85,
    });
  }

  // Fiber (if tracked)
  if ((log.totalFiber ?? 0) > 0 && (log.totalFiber ?? 0) < 15) {
    recs.push({
      macro: 'fiber',
      message: `Fiber is low (${log.totalFiber}g). Add vegetables, legumes, or whole grains to your next meal.`,
      priority: 50,
    });
  }

  // Meal timing nudge
  const hour = new Date().getHours();
  const hasDinner = log.items.some(i => i.mealType === 'dinner');
  if (hour >= 17 && !hasDinner && calRemaining > 300) {
    recs.push({
      macro: 'general',
      message: `Don't forget dinner — you have ${calRemaining} cal left to reach your goal.`,
      priority: 70,
    });
  }

  return recs.sort((a, b) => b.priority - a.priority);
}
