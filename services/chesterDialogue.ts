import { DialogueContext } from '../types';

// ─── Chester Dynamic Dialogue Engine ───
//
// Generates context-aware messages based on time of day, user progress,
// streak status, Chester's mood/health, and macro/water progress.
// No AI calls — just well-crafted conditional logic with weighted selection.

interface WeightedMessage {
  message: string;
  weight: number; // higher = more likely to be picked
}

// ─── Message Pools ───

const MORNING_EARLY = [
  "Good morning, early bird! Chester's tail is wagging already!",
  "Rise and shine! Let's start the day with a good breakfast!",
  "Morning! Chester's ready for a new day of tracking!",
  "The sun is up and so is Chester! What's for breakfast?",
  "Early start today! Chester approves of your dedication!",
];

const MORNING = [
  "Good morning! Have you had breakfast yet? Chester's curious!",
  "Morning! Let's make today a great nutrition day!",
  "Woof! Another beautiful morning to track some food!",
  "Good morning! Chester's got a nose for a good breakfast!",
  "Hey there! Chester's been waiting for you! Time to eat!",
];

const AFTERNOON = [
  "Afternoon! How's lunch going? Chester wants to know!",
  "Hey! Hope you're having a paw-some afternoon!",
  "Midday check-in! Are you staying hydrated?",
  "Afternoon vibes! Chester's keeping an eye on your macros!",
  "Lunch time zone! Have you fed yourself (and Chester)?",
];

const EVENING = [
  "Good evening! How did today's nutrition go?",
  "Evening! Chester's winding down but still tracking!",
  "Almost done for the day! Let's review how you did!",
  "Evening check-in! Chester hopes you ate well today!",
  "Winding down! Chester's proud of you for tracking today!",
];

const NIGHT = [
  "It's late! Chester's getting sleepy... goodnight soon?",
  "Burning the midnight oil? Chester's here with you!",
  "Late night snacking? Chester won't judge... much!",
  "Chester's yawning but still here for you!",
  "Night owl mode! Don't forget to rest up!",
];

// ─── Streak Messages ───

const NO_STREAK = [
  "Let's start a new streak today! Chester believes in you!",
  "Day one of something great! Log some food to begin!",
  "Fresh start! Chester's ready to build a streak with you!",
];

const STREAK_SMALL = [ // 2-6 days
  "Nice! {streak} day streak! Keep it going!",
  "{streak} days strong! Chester's tail is wagging!",
  "You're on a roll! {streak} days and counting!",
  "{streak} day streak! Chester's getting excited!",
];

const STREAK_WEEK = [ // 7-13 days
  "A whole week! {streak} days! Chester's SO proud!",
  "{streak} day streak! You're earning 2x XP now!",
  "Week streak unlocked! Chester's doing zoomies!",
];

const STREAK_STRONG = [ // 14-29 days
  "{streak} days! You're a tracking machine!",
  "Incredible! {streak} day streak! Chester's in awe!",
  "{streak} days strong! You're unstoppable!",
];

const STREAK_MONTH = [ // 30-59 days
  "{streak} DAYS! Chester can't believe it! 3x XP!",
  "A month+ streak! {streak} days! You're legendary!",
  "{streak} day streak! Chester's never been happier!",
];

const STREAK_EPIC = [ // 60+ days
  "{streak} days! You and Chester are an epic duo!",
  "INCREDIBLE {streak} day streak! 5x XP! Chester's golden!",
  "{streak} days of dedication! Chester's glowing with pride!",
];

// ─── Progress Messages ───

const NO_FOOD_LOGGED = [
  "Chester's tummy is rumbling! Log something to feed him!",
  "No food logged yet today! Chester's waiting patiently...",
  "Your plate is empty! Time to scan or add some food!",
  "Chester's looking at his empty bowl... log some food!",
];

const GOOD_PROGRESS = [ // 40-80% of calorie goal
  "Nice progress! You're at {percent}% of your calorie goal!",
  "Looking good! {calories} cal so far. Keep going!",
  "Solid day! Chester approves of your eating!",
  "You're on track! {percent}% of your daily goal!",
];

const NEARLY_THERE = [ // 80-100% of calorie goal
  "Almost at your goal! Just {remaining} cal to go!",
  "So close! Chester can smell the finish line!",
  "{percent}% there! One more meal should do it!",
];

const GOAL_HIT = [ // 100%+ of calorie goal, not over
  "Goal reached! Chester's doing a happy dance!",
  "You hit your calorie target! Paw-fect day!",
  "Nailed it! Chester gives you a gold star!",
];

const OVER_GOAL = [ // significantly over calorie goal
  "A bit over today, but tomorrow's a fresh start!",
  "Over your goal, but don't stress! Chester still loves you!",
  "Hey, some days are like that! Chester's not judging!",
];

// ─── Water Messages ───

const LOW_WATER = [ // less than 25% of water goal
  "Don't forget to drink water! Chester needs you hydrated!",
  "Water check! You've barely had any today!",
  "Hydration reminder! Your water glasses are looking empty!",
];

const WATER_GOAL_HIT = [
  "Water goal smashed! Chester's impressed!",
  "Fully hydrated! That's a boost to your nutrition score!",
  "All your water glasses are full! Great job!",
];

// ─── Mood Messages ───

const CHESTER_SAD = [
  "Chester's feeling a bit down... log some food to cheer him up!",
  "Chester misses you! Come back and track some meals!",
  "Chester's sad... he needs your attention!",
];

const CHESTER_HUNGRY = [
  "Chester's HUNGRY! Feed him by logging your meals!",
  "Ruff! Chester's stomach is growling! Time to log!",
  "Chester's giving you puppy eyes... he wants food data!",
];

const CHESTER_EXCITED = [
  "Chester's SO excited! Look at all this great tracking!",
  "Bark bark! Chester's bouncing off the walls!",
  "Chester can't contain his excitement! You're doing amazing!",
];

// ─── Low Health Messages ───

const LOW_HEALTH = [
  "Chester's health is low ({health}%). Log food to help him recover!",
  "Chester needs care! His health is at {health}%. Track your meals!",
  "Chester's feeling weak... consistent logging will heal him!",
];

// ─── Level Messages ───

const HIGH_LEVEL = [
  "Level {level} Chester! You two have come so far together!",
  "Lv.{level}! Chester's one impressive golden retriever!",
];

// ─── Selection Logic ───

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function fillTemplate(message: string, vars: Record<string, string | number>): string {
  let result = message;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export function getChesterDialogue(context: DialogueContext): string {
  const { chester, todayLog, goals, waterLog, hour } = context;
  const candidates: WeightedMessage[] = [];

  const totalCalories = todayLog?.totalCalories || 0;
  const caloriePercent = goals.dailyCalories > 0 ? Math.round((totalCalories / goals.dailyCalories) * 100) : 0;
  const caloriesRemaining = goals.dailyCalories - totalCalories;
  const waterPercent = goals.dailyWaterGlasses > 0 ? waterLog.glasses / goals.dailyWaterGlasses : 0;
  const itemCount = todayLog?.items.length || 0;

  const vars = {
    streak: chester.streak,
    percent: caloriePercent,
    calories: totalCalories,
    remaining: Math.max(0, caloriesRemaining),
    health: chester.health,
    level: chester.level,
  };

  // ─── Time of Day (always add one) ───
  if (hour >= 5 && hour < 8) {
    candidates.push({ message: pickRandom(MORNING_EARLY), weight: 3 });
  } else if (hour >= 8 && hour < 12) {
    candidates.push({ message: pickRandom(MORNING), weight: 3 });
  } else if (hour >= 12 && hour < 17) {
    candidates.push({ message: pickRandom(AFTERNOON), weight: 3 });
  } else if (hour >= 17 && hour < 21) {
    candidates.push({ message: pickRandom(EVENING), weight: 3 });
  } else {
    candidates.push({ message: pickRandom(NIGHT), weight: 3 });
  }

  // ─── Streak (high priority) ───
  if (chester.streak === 0) {
    candidates.push({ message: pickRandom(NO_STREAK), weight: 4 });
  } else if (chester.streak < 7) {
    candidates.push({ message: pickRandom(STREAK_SMALL), weight: 5 });
  } else if (chester.streak < 14) {
    candidates.push({ message: pickRandom(STREAK_WEEK), weight: 6 });
  } else if (chester.streak < 30) {
    candidates.push({ message: pickRandom(STREAK_STRONG), weight: 6 });
  } else if (chester.streak < 60) {
    candidates.push({ message: pickRandom(STREAK_MONTH), weight: 7 });
  } else {
    candidates.push({ message: pickRandom(STREAK_EPIC), weight: 8 });
  }

  // ─── Food Progress ───
  if (itemCount === 0) {
    candidates.push({ message: pickRandom(NO_FOOD_LOGGED), weight: 6 });
  } else if (caloriePercent > 110) {
    candidates.push({ message: pickRandom(OVER_GOAL), weight: 5 });
  } else if (caloriePercent >= 95) {
    candidates.push({ message: pickRandom(GOAL_HIT), weight: 7 });
  } else if (caloriePercent >= 80) {
    candidates.push({ message: pickRandom(NEARLY_THERE), weight: 6 });
  } else if (caloriePercent >= 40) {
    candidates.push({ message: pickRandom(GOOD_PROGRESS), weight: 4 });
  }

  // ─── Water ───
  if (waterLog.goalReached) {
    candidates.push({ message: pickRandom(WATER_GOAL_HIT), weight: 5 });
  } else if (waterPercent < 0.25 && hour >= 12) {
    candidates.push({ message: pickRandom(LOW_WATER), weight: 5 });
  }

  // ─── Chester Mood ───
  if (chester.mood === 'sad') {
    candidates.push({ message: pickRandom(CHESTER_SAD), weight: 6 });
  } else if (chester.mood === 'hungry') {
    candidates.push({ message: pickRandom(CHESTER_HUNGRY), weight: 5 });
  } else if (chester.mood === 'excited') {
    candidates.push({ message: pickRandom(CHESTER_EXCITED), weight: 4 });
  }

  // ─── Health ───
  if (chester.health < 40) {
    candidates.push({ message: pickRandom(LOW_HEALTH), weight: 6 });
  }

  // ─── Level ───
  if (chester.level >= 10) {
    candidates.push({ message: pickRandom(HIGH_LEVEL), weight: 2 });
  }

  // ─── Weighted Random Selection ───
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll <= 0) {
      return fillTemplate(candidate.message, vars);
    }
  }

  // Fallback (shouldn't reach here)
  return fillTemplate(candidates[0].message, vars);
}
