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
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  goals: UserGoals;
  chester: ChesterState;
  createdAt: number;
  onboardingComplete: boolean;
  weightHistory: { date: string; weight: number }[];
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
  date: string; // YYYY-MM-DD
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
