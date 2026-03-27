import { getDailyLog, getWaterLog, getProfile, getTodayKey } from './storage';
import { calculateNutritionScore } from '../utils/nutrition';
import { DailyLog, UserGoals } from '../types';

export interface NutritionInsight {
  id: string;
  type: 'tip' | 'trend' | 'alert' | 'celebration';
  title: string;
  message: string;
  icon: string;
  priority: number; // higher = shown first
}

// ─── Per-domain insight generators ───
// Each returns a single NutritionInsight, or null if the condition isn't met.

function calorieInsight(avgCalories: number, goals: UserGoals): NutritionInsight | null {
  const calPercent = Math.round((avgCalories / goals.dailyCalories) * 100);
  const calDiff = avgCalories - goals.dailyCalories;
  if (calPercent >= 90 && calPercent <= 110) {
    return { id: 'cal_on_track', type: 'celebration', title: 'Calorie Goals Nailed', icon: '🎯', priority: 90,
      message: `You averaged ${avgCalories} cal/day this week — right on target! Chester is proud.` };
  }
  if (calPercent < 75) {
    return { id: 'cal_under', type: 'alert', title: 'Under-Eating Alert', icon: '⚠️', priority: 95,
      message: `You averaged only ${avgCalories} cal/day (${calPercent}% of goal). Make sure you're fueling enough!` };
  }
  if (calPercent > 120) {
    return { id: 'cal_over', type: 'tip', title: 'Over Calorie Goal', icon: '📊', priority: 85,
      message: `You averaged ${avgCalories} cal/day — ${Math.abs(calDiff)} over your ${goals.dailyCalories} goal. Consider portion awareness.` };
  }
  return null;
}

function proteinInsight(avgProtein: number, goals: UserGoals): NutritionInsight | null {
  const proteinPercent = Math.round((avgProtein / goals.dailyProtein) * 100);
  if (proteinPercent < 70) {
    return { id: 'protein_low', type: 'tip', title: 'Protein Gap', icon: '🥩', priority: 80,
      message: `You averaged ${avgProtein}g protein/day (${proteinPercent}% of ${goals.dailyProtein}g goal). Try adding eggs, chicken, or Greek yogurt.` };
  }
  if (proteinPercent >= 90) {
    return { id: 'protein_great', type: 'celebration', title: 'Protein Champion', icon: '💪', priority: 70,
      message: `Averaging ${avgProtein}g protein/day — excellent for recovery and muscle!` };
  }
  return null;
}

function carbsInsight(avgCarbs: number, goals: UserGoals): NutritionInsight | null {
  const carbsPercent = Math.round((avgCarbs / goals.dailyCarbs) * 100);
  if (carbsPercent > 130) {
    return { id: 'carbs_high', type: 'tip', title: 'High Carb Intake', icon: '🍞', priority: 65,
      message: `Averaging ${avgCarbs}g carbs/day (${carbsPercent}% of goal). Consider swapping some refined carbs for whole grains or veggies.` };
  }
  return null;
}

function fatInsight(avgFat: number, goals: UserGoals): NutritionInsight | null {
  const fatPercent = Math.round((avgFat / goals.dailyFat) * 100);
  if (fatPercent > 130) {
    return { id: 'fat_high', type: 'tip', title: 'Fat Intake High', icon: '🥑', priority: 60,
      message: `Averaging ${avgFat}g fat/day. Try choosing leaner options or cooking with less oil.` };
  }
  return null;
}

function waterInsight(waterGoalDays: number, goals: UserGoals): NutritionInsight | null {
  if (waterGoalDays >= 5) {
    return { id: 'water_great', type: 'celebration', title: 'Hydration Hero', icon: '💧', priority: 75,
      message: `You hit your water goal ${waterGoalDays}/7 days this week! Great hydration habits.` };
  }
  if (waterGoalDays <= 2) {
    return { id: 'water_low', type: 'alert', title: 'Drink More Water', icon: '🚰', priority: 82,
      message: `Only hit water goal ${waterGoalDays}/7 days. Try setting reminders or keeping a water bottle nearby.` };
  }
  return null;
}

function consistencyInsight(activeDaysCount: number): NutritionInsight | null {
  if (activeDaysCount >= 6) {
    return { id: 'consistency_great', type: 'celebration', title: 'Consistency King', icon: '🔥', priority: 88,
      message: `You logged ${activeDaysCount}/7 days this week. Consistency is the key to results!` };
  }
  if (activeDaysCount <= 3) {
    return { id: 'consistency_low', type: 'tip', title: 'Log More Often', icon: '📝', priority: 86,
      message: `Only ${activeDaysCount} days tracked this week. Even quick entries help build the habit!` };
  }
  return null;
}

function mealFrequencyInsight(avgMeals: number, activeDaysCount: number): NutritionInsight | null {
  if (avgMeals < 2.5 && activeDaysCount >= 3) {
    return { id: 'few_meals', type: 'tip', title: 'Eat More Frequently', icon: '⏰', priority: 55,
      message: `Averaging only ${avgMeals} meals/day. Spreading meals throughout the day can help with energy and metabolism.` };
  }
  return null;
}

function scoreInsight(avgScore: number, activeDaysCount: number): NutritionInsight | null {
  if (avgScore >= 80) {
    return { id: 'score_high', type: 'celebration', title: 'Top Nutrition Score', icon: '⭐', priority: 92,
      message: `Your average nutrition score is ${avgScore}/100 — keep up the amazing work!` };
  }
  if (avgScore < 50 && activeDaysCount >= 3) {
    return { id: 'score_low', type: 'tip', title: 'Room to Improve', icon: '📈', priority: 78,
      message: `Average nutrition score: ${avgScore}/100. Focus on balanced meals and hitting your macro targets.` };
  }
  return null;
}

// ─── Public API ───

export async function generateWeeklyInsights(): Promise<NutritionInsight[]> {
  const profile = await getProfile();
  const goals = profile.goals;

  // Gather last 7 days of data
  const logs: DailyLog[] = [];
  const waterGoalDaysArr: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    logs.push(await getDailyLog(key));
    const water = await getWaterLog(key);
    waterGoalDaysArr.push(water.glasses);
  }

  const activeDays = logs.filter(l => l.items.length > 0);
  if (activeDays.length === 0) {
    return [{
      id: 'no_data', type: 'tip', title: 'Start Tracking', icon: '🚀', priority: 100,
      message: 'Log your first meal to unlock personalized nutrition insights!',
    }];
  }

  // Compute weekly averages
  const avgCalories = Math.round(activeDays.reduce((s, l) => s + l.totalCalories, 0) / activeDays.length);
  const avgProtein  = Math.round(activeDays.reduce((s, l) => s + l.totalProtein, 0) / activeDays.length);
  const avgCarbs    = Math.round(activeDays.reduce((s, l) => s + l.totalCarbs, 0) / activeDays.length);
  const avgFat      = Math.round(activeDays.reduce((s, l) => s + l.totalFat, 0) / activeDays.length);
  const avgScore    = Math.round(activeDays.reduce((s, l) => s + calculateNutritionScore(l, goals), 0) / activeDays.length);
  const avgMeals    = Math.round(activeDays.reduce((s, l) => s + l.items.length, 0) / activeDays.length * 10) / 10;
  const waterGoalDays = waterGoalDaysArr.filter(g => g >= goals.dailyWaterGlasses).length;

  // Collect all non-null insights
  const insights: NutritionInsight[] = [
    calorieInsight(avgCalories, goals),
    proteinInsight(avgProtein, goals),
    carbsInsight(avgCarbs, goals),
    fatInsight(avgFat, goals),
    waterInsight(waterGoalDays, goals),
    consistencyInsight(activeDays.length),
    mealFrequencyInsight(avgMeals, activeDays.length),
    scoreInsight(avgScore, activeDays.length),
  ].filter((i): i is NutritionInsight => i !== null);

  return insights.sort((a, b) => b.priority - a.priority);
}

export async function getDailyTip(): Promise<NutritionInsight> {
  const profile = await getProfile();
  const today = getTodayKey();
  const todayLog = await getDailyLog(today);
  const waterLog = await getWaterLog(today);
  const hour = new Date().getHours();

  if (hour < 10 && todayLog.items.length === 0) {
    return { id: 'morning_tip', type: 'tip', title: 'Good Morning', icon: '🌅', priority: 50,
      message: 'Start your day with a protein-rich breakfast to keep you full and energized!' };
  }

  if (hour >= 12 && hour < 14 && todayLog.items.filter(i => i.mealType === 'lunch').length === 0) {
    return { id: 'lunch_tip', type: 'tip', title: 'Lunchtime', icon: '☀️', priority: 50,
      message: "Don't skip lunch! A balanced meal keeps afternoon energy crashes away." };
  }

  if (waterLog.glasses < 3 && hour > 14) {
    return { id: 'water_tip', type: 'alert', title: 'Stay Hydrated', icon: '💧', priority: 60,
      message: `Only ${waterLog.glasses} glasses of water so far. Try to catch up before evening!` };
  }

  const score = calculateNutritionScore(todayLog, profile.goals);
  if (score >= 80 && todayLog.items.length >= 3) {
    return { id: 'great_day', type: 'celebration', title: 'Great Day So Far', icon: '🌟', priority: 50,
      message: 'Your nutrition is on point today! Chester is wagging his tail.' };
  }

  const tips = [
    { title: 'Protein Power',   message: 'Adding protein to every meal helps with satiety and muscle recovery.',       icon: '💪' },
    { title: 'Fiber Focus',     message: 'Aim for fruits, veggies, and whole grains to hit your fiber goals.',         icon: '🥦' },
    { title: 'Mindful Eating',  message: 'Eating slowly helps you feel fuller and enjoy your food more.',              icon: '🧘' },
    { title: 'Prep Ahead',      message: 'Meal prepping saves time and makes healthy choices easier.',                 icon: '🍱' },
    { title: 'Snack Smart',     message: 'Choose nutrient-dense snacks like nuts, yogurt, or fruit.',                  icon: '🥜' },
    { title: 'Sleep & Nutrition', message: 'Good sleep improves food choices and metabolism. Aim for 7-9 hours.',     icon: '😴' },
  ];

  const tip = tips[new Date().getDay() % tips.length];
  return { id: 'daily_general', type: 'tip', title: tip.title, message: tip.message, icon: tip.icon, priority: 40 };
}
