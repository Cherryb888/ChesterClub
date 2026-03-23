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
  source: 'ai_scan' | 'text_search' | 'manual' | 'recent';
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

export interface ChesterState {
  level: number;
  xp: number;
  mood: 'happy' | 'excited' | 'neutral' | 'hungry' | 'sleepy';
  streak: number;
  lastFedDate: string | null;
  outfit: string;
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
