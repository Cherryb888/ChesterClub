export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  imageUri?: string;
  timestamp: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  source: 'ai_scan' | 'text_search' | 'manual' | 'recent' | 'meal_plan';
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface UserGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailyWaterGlasses: number; // target glasses of water per day
}

export type ChesterLifeStage = 'puppy' | 'young' | 'adult' | 'champion' | 'golden';

export interface ChesterState {
  level: number;
  xp: number;
  mood: 'happy' | 'excited' | 'neutral' | 'hungry' | 'sleepy' | 'sad';
  streak: number;
  lastFedDate: string | null;
  outfit: string;
  health: number; // 0-100 health bar
  achievements: string[];
  coins: number;
  previousStreak: number;
  streakShieldActive: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  goals: UserGoals;
  dietProfile: DietProfile;
  chester: ChesterState;
  createdAt: number;
  onboardingComplete: boolean;
  weightHistory: { date: string; weight: number; unit: 'kg' | 'lbs' }[];
  isPremiumMax: boolean; // highest tier subscription
}

// ─── Diet & Health Profile ───

export type DietType = 'no_restriction' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'mediterranean' | 'halal' | 'kosher';
export type FitnessGoal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'improve_health';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type CookingLevel = 'beginner' | 'intermediate' | 'advanced';
export type MealsPerDay = 3 | 4 | 5 | 6;

export interface DietProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  fitnessGoal: FitnessGoal;
  dietType: DietType;
  allergies: string[]; // e.g. ['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy']
  dislikedFoods: string[]; // free-text list of foods to avoid
  cookingLevel: CookingLevel;
  mealsPerDay: MealsPerDay;
  maxPrepTimeMinutes: number; // max time per meal in minutes
  cuisinePreferences: string[]; // e.g. ['italian', 'asian', 'mexican', 'indian']
}

export interface GeminiFoodResult {
  foods: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
  }[];
  overallScore: 'great' | 'good' | 'okay' | 'poor';
  chesterReaction: string;
}

export interface MealPlan {
  id: string;
  createdAt: number;
  days: MealPlanDay[];
}

export interface MealPlanDay {
  date: string;
  meals: {
    breakfast: PlannedMeal;
    lunch: PlannedMeal;
    dinner: PlannedMeal;
    snack: PlannedMeal;
  };
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface PlannedMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

// ─── Water Tracking ───

export interface WaterLog {
  date: string; // YYYY-MM-DD
  glasses: number;
  goalReached: boolean;
}

// ─── Challenges & Coins ───

export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  target: number;
  reward: number; // coins
  icon: string;
}

export interface ChallengeProgress {
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt?: number;
  coinsClaimed: boolean;
}

// ─── Chester Dialogue ───

export interface DialogueContext {
  chester: ChesterState;
  todayLog: DailyLog | null;
  goals: UserGoals;
  waterLog: WaterLog;
  hour: number; // 0-23
}

export interface ChallengesState {
  date: string; // for tracking daily reset
  weekStart: string; // for tracking weekly reset
  monthKey: string; // YYYY-MM for monthly reset
  daily: ChallengeProgress[];
  weekly: ChallengeProgress[];
  monthly: ChallengeProgress[];
  allTime: ChallengeProgress[];
  totalCoinsEarned: number;
}
