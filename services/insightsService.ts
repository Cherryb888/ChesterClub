import { getDailyLog, getWaterLog, getProfile, calculateNutritionScore, getTodayKey } from './storage';
import { DailyLog, UserGoals } from '../types';

export interface NutritionInsight {
  id: string;
  type: 'tip' | 'trend' | 'alert' | 'celebration';
  title: string;
  message: string;
  icon: string;
  priority: number; // higher = shown first
}

export async function generateWeeklyInsights(): Promise<NutritionInsight[]> {
  const profile = await getProfile();
  const goals = profile.goals;
  const insights: NutritionInsight[] = [];

  // Gather last 7 days of data
  const logs: DailyLog[] = [];
  const waterDays: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const log = await getDailyLog(key);
    logs.push(log);
    const water = await getWaterLog(key);
    waterDays.push(water.glasses);
  }

  const activeDays = logs.filter(l => l.items.length > 0);
  if (activeDays.length === 0) {
    insights.push({
      id: 'no_data',
      type: 'tip',
      title: 'Start Tracking',
      message: 'Log your first meal to unlock personalized nutrition insights!',
      icon: '🚀',
      priority: 100,
    });
    return insights;
  }

  // Average macros
  const avgCalories = Math.round(activeDays.reduce((s, l) => s + l.totalCalories, 0) / activeDays.length);
  const avgProtein = Math.round(activeDays.reduce((s, l) => s + l.totalProtein, 0) / activeDays.length);
  const avgCarbs = Math.round(activeDays.reduce((s, l) => s + l.totalCarbs, 0) / activeDays.length);
  const avgFat = Math.round(activeDays.reduce((s, l) => s + l.totalFat, 0) / activeDays.length);

  // Average nutrition score
  const avgScore = Math.round(activeDays.reduce((s, l) => s + calculateNutritionScore(l, goals), 0) / activeDays.length);

  // Meals per day
  const avgMeals = Math.round(activeDays.reduce((s, l) => s + l.items.length, 0) / activeDays.length * 10) / 10;

  // --- Calorie insights ---
  const calDiff = avgCalories - goals.dailyCalories;
  const calPercent = Math.round((avgCalories / goals.dailyCalories) * 100);

  if (calPercent >= 90 && calPercent <= 110) {
    insights.push({
      id: 'cal_on_track',
      type: 'celebration',
      title: 'Calorie Goals Nailed',
      message: `You averaged ${avgCalories} cal/day this week — right on target! Chester is proud.`,
      icon: '🎯',
      priority: 90,
    });
  } else if (calPercent < 75) {
    insights.push({
      id: 'cal_under',
      type: 'alert',
      title: 'Under-Eating Alert',
      message: `You averaged only ${avgCalories} cal/day (${calPercent}% of goal). Make sure you're fueling enough!`,
      icon: '⚠️',
      priority: 95,
    });
  } else if (calPercent > 120) {
    insights.push({
      id: 'cal_over',
      type: 'tip',
      title: 'Over Calorie Goal',
      message: `You averaged ${avgCalories} cal/day — ${Math.abs(calDiff)} over your ${goals.dailyCalories} goal. Consider portion awareness.`,
      icon: '📊',
      priority: 85,
    });
  }

  // --- Protein insights ---
  const proteinPercent = Math.round((avgProtein / goals.dailyProtein) * 100);
  if (proteinPercent < 70) {
    insights.push({
      id: 'protein_low',
      type: 'tip',
      title: 'Protein Gap',
      message: `You averaged ${avgProtein}g protein/day (${proteinPercent}% of ${goals.dailyProtein}g goal). Try adding eggs, chicken, or Greek yogurt.`,
      icon: '🥩',
      priority: 80,
    });
  } else if (proteinPercent >= 90) {
    insights.push({
      id: 'protein_great',
      type: 'celebration',
      title: 'Protein Champion',
      message: `Averaging ${avgProtein}g protein/day — excellent for recovery and muscle!`,
      icon: '💪',
      priority: 70,
    });
  }

  // --- Carbs insights ---
  const carbsPercent = Math.round((avgCarbs / goals.dailyCarbs) * 100);
  if (carbsPercent > 130) {
    insights.push({
      id: 'carbs_high',
      type: 'tip',
      title: 'High Carb Intake',
      message: `Averaging ${avgCarbs}g carbs/day (${carbsPercent}% of goal). Consider swapping some refined carbs for whole grains or veggies.`,
      icon: '🍞',
      priority: 65,
    });
  }

  // --- Fat insights ---
  const fatPercent = Math.round((avgFat / goals.dailyFat) * 100);
  if (fatPercent > 130) {
    insights.push({
      id: 'fat_high',
      type: 'tip',
      title: 'Fat Intake High',
      message: `Averaging ${avgFat}g fat/day. Try choosing leaner options or cooking with less oil.`,
      icon: '🥑',
      priority: 60,
    });
  }

  // --- Water insights ---
  const avgWater = Math.round(waterDays.reduce((s, g) => s + g, 0) / 7 * 10) / 10;
  const waterGoalDays = waterDays.filter(g => g >= goals.dailyWaterGlasses).length;

  if (waterGoalDays >= 5) {
    insights.push({
      id: 'water_great',
      type: 'celebration',
      title: 'Hydration Hero',
      message: `You hit your water goal ${waterGoalDays}/7 days this week! Great hydration habits.`,
      icon: '💧',
      priority: 75,
    });
  } else if (waterGoalDays <= 2) {
    insights.push({
      id: 'water_low',
      type: 'alert',
      title: 'Drink More Water',
      message: `Only hit water goal ${waterGoalDays}/7 days. Try setting reminders or keeping a water bottle nearby.`,
      icon: '🚰',
      priority: 82,
    });
  }

  // --- Consistency insights ---
  if (activeDays.length >= 6) {
    insights.push({
      id: 'consistency_great',
      type: 'celebration',
      title: 'Consistency King',
      message: `You logged ${activeDays.length}/7 days this week. Consistency is the key to results!`,
      icon: '🔥',
      priority: 88,
    });
  } else if (activeDays.length <= 3) {
    insights.push({
      id: 'consistency_low',
      type: 'tip',
      title: 'Log More Often',
      message: `Only ${activeDays.length} days tracked this week. Even quick entries help build the habit!`,
      icon: '📝',
      priority: 86,
    });
  }

  // --- Meal timing ---
  if (avgMeals < 2.5 && activeDays.length >= 3) {
    insights.push({
      id: 'few_meals',
      type: 'tip',
      title: 'Eat More Frequently',
      message: `Averaging only ${avgMeals} meals/day. Spreading meals throughout the day can help with energy and metabolism.`,
      icon: '⏰',
      priority: 55,
    });
  }

  // --- Score trend ---
  if (avgScore >= 80) {
    insights.push({
      id: 'score_high',
      type: 'celebration',
      title: 'Top Nutrition Score',
      message: `Your average nutrition score is ${avgScore}/100 — keep up the amazing work!`,
      icon: '⭐',
      priority: 92,
    });
  } else if (avgScore < 50 && activeDays.length >= 3) {
    insights.push({
      id: 'score_low',
      type: 'tip',
      title: 'Room to Improve',
      message: `Average nutrition score: ${avgScore}/100. Focus on balanced meals and hitting your macro targets.`,
      icon: '📈',
      priority: 78,
    });
  }

  // Sort by priority
  return insights.sort((a, b) => b.priority - a.priority);
}

export async function getDailyTip(): Promise<NutritionInsight> {
  const profile = await getProfile();
  const today = getTodayKey();
  const todayLog = await getDailyLog(today);
  const waterLog = await getWaterLog(today);
  const hour = new Date().getHours();

  // Context-aware daily tip
  if (hour < 10 && todayLog.items.length === 0) {
    return {
      id: 'morning_tip',
      type: 'tip',
      title: 'Good Morning',
      message: 'Start your day with a protein-rich breakfast to keep you full and energized!',
      icon: '🌅',
      priority: 50,
    };
  }

  if (hour >= 12 && hour < 14 && todayLog.items.filter(i => i.mealType === 'lunch').length === 0) {
    return {
      id: 'lunch_tip',
      type: 'tip',
      title: 'Lunchtime',
      message: 'Don\'t skip lunch! A balanced meal keeps afternoon energy crashes away.',
      icon: '☀️',
      priority: 50,
    };
  }

  if (waterLog.glasses < 3 && hour > 14) {
    return {
      id: 'water_tip',
      type: 'alert',
      title: 'Stay Hydrated',
      message: `Only ${waterLog.glasses} glasses of water so far. Try to catch up before evening!`,
      icon: '💧',
      priority: 60,
    };
  }

  const score = calculateNutritionScore(todayLog, profile.goals);
  if (score >= 80 && todayLog.items.length >= 3) {
    return {
      id: 'great_day',
      type: 'celebration',
      title: 'Great Day So Far',
      message: 'Your nutrition is on point today! Chester is wagging his tail.',
      icon: '🌟',
      priority: 50,
    };
  }

  // Default tip
  const tips = [
    { title: 'Protein Power', message: 'Adding protein to every meal helps with satiety and muscle recovery.', icon: '💪' },
    { title: 'Fiber Focus', message: 'Aim for fruits, veggies, and whole grains to hit your fiber goals.', icon: '🥦' },
    { title: 'Mindful Eating', message: 'Eating slowly helps you feel fuller and enjoy your food more.', icon: '🧘' },
    { title: 'Prep Ahead', message: 'Meal prepping saves time and makes healthy choices easier.', icon: '🍱' },
    { title: 'Snack Smart', message: 'Choose nutrient-dense snacks like nuts, yogurt, or fruit.', icon: '🥜' },
    { title: 'Sleep & Nutrition', message: 'Good sleep improves food choices and metabolism. Aim for 7-9 hours.', icon: '😴' },
  ];

  const dayIndex = new Date().getDay();
  const tip = tips[dayIndex % tips.length];

  return {
    id: 'daily_general',
    type: 'tip',
    title: tip.title,
    message: tip.message,
    icon: tip.icon,
    priority: 40,
  };
}
