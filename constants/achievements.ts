// ─── Achievement Definitions ───
//
// Master list of all achievements. IDs stored in chester.achievements (string[]).
// Metadata lives here — no schema migration needed to add new badges.

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  coinReward: number;
  hint: string; // shown when locked
}

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#78909C',
  rare: '#42A5F5',
  epic: '#AB47BC',
  legendary: '#FFD700',
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ─── Getting Started (Common) ───
  {
    id: 'first_scan',
    title: 'First Bite',
    description: 'Scan your first food item',
    icon: '📸',
    rarity: 'common',
    coinReward: 10,
    hint: 'Scan a food item to unlock',
  },
  {
    id: 'first_water',
    title: 'First Sip',
    description: 'Log your first glass of water',
    icon: '💧',
    rarity: 'common',
    coinReward: 5,
    hint: 'Drink a glass of water to unlock',
  },
  {
    id: 'first_meal_plan',
    title: 'Meal Planner',
    description: 'Generate your first meal plan',
    icon: '📋',
    rarity: 'common',
    coinReward: 10,
    hint: 'Create a meal plan to unlock',
  },
  {
    id: 'log_3_meals',
    title: 'Three Square Meals',
    description: 'Log 3 meals in a single day',
    icon: '🍽️',
    rarity: 'common',
    coinReward: 15,
    hint: 'Log breakfast, lunch, and dinner',
  },

  // ─── Streak Badges ───
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'common',
    coinReward: 25,
    hint: 'Keep logging for 7 days straight',
  },
  {
    id: 'streak_14',
    title: 'Fortnight Fighter',
    description: 'Maintain a 14-day streak',
    icon: '🔥🔥',
    rarity: 'rare',
    coinReward: 50,
    hint: 'Keep logging for 14 days straight',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🔥🔥🔥',
    rarity: 'rare',
    coinReward: 100,
    hint: 'Keep logging for 30 days straight',
  },
  {
    id: 'streak_60',
    title: 'Dedication King',
    description: 'Maintain a 60-day streak',
    icon: '💎',
    rarity: 'epic',
    coinReward: 200,
    hint: 'Keep logging for 60 days straight',
  },
  {
    id: 'streak_90',
    title: 'Unstoppable',
    description: 'Maintain a 90-day streak',
    icon: '👑',
    rarity: 'legendary',
    coinReward: 500,
    hint: 'Keep logging for 90 days straight',
  },

  // ─── Chester Life Stages ───
  {
    id: 'young_dog',
    title: 'Growing Pup',
    description: 'Reach Chester level 6',
    icon: '🐕',
    rarity: 'common',
    coinReward: 20,
    hint: 'Level up Chester to level 6',
  },
  {
    id: 'adult_dog',
    title: 'Good Boy',
    description: 'Reach Chester level 16',
    icon: '🦮',
    rarity: 'rare',
    coinReward: 50,
    hint: 'Level up Chester to level 16',
  },
  {
    id: 'champion',
    title: 'Champion',
    description: 'Reach Chester level 31',
    icon: '🏆',
    rarity: 'epic',
    coinReward: 150,
    hint: 'Level up Chester to level 31',
  },
  {
    id: 'golden',
    title: 'Golden Legend',
    description: 'Reach Chester level 50',
    icon: '🌟',
    rarity: 'legendary',
    coinReward: 500,
    hint: 'Level up Chester to level 50',
  },

  // ─── Nutrition Badges ───
  {
    id: 'perfect_day',
    title: 'Perfect Day',
    description: 'Hit your calorie goal within 5%',
    icon: '🎯',
    rarity: 'rare',
    coinReward: 30,
    hint: 'Get within 5% of your calorie goal',
  },
  {
    id: 'protein_king',
    title: 'Protein King',
    description: 'Hit your protein goal 3 days in a row',
    icon: '💪',
    rarity: 'rare',
    coinReward: 40,
    hint: 'Meet your protein target consistently',
  },
  {
    id: 'score_90',
    title: 'Nutrition Star',
    description: 'Get a nutrition score of 90+',
    icon: '⭐',
    rarity: 'rare',
    coinReward: 35,
    hint: 'Achieve an excellent nutrition score',
  },
  {
    id: 'score_100',
    title: 'Flawless',
    description: 'Get a perfect 100 nutrition score',
    icon: '💯',
    rarity: 'epic',
    coinReward: 100,
    hint: 'Achieve a perfect nutrition score',
  },

  // ─── Water Badges ───
  {
    id: 'water_streak_3',
    title: 'Hydration Habit',
    description: 'Hit water goal 3 days in a row',
    icon: '🌊',
    rarity: 'common',
    coinReward: 15,
    hint: 'Drink your daily water 3 days straight',
  },
  {
    id: 'water_streak_7',
    title: 'Water Champion',
    description: 'Hit water goal 7 days in a row',
    icon: '🏊',
    rarity: 'rare',
    coinReward: 40,
    hint: 'Drink your daily water 7 days straight',
  },

  // ─── Scanning & Logging Badges ───
  {
    id: 'scan_10',
    title: 'Scanner Pro',
    description: 'Scan 10 food items total',
    icon: '📷',
    rarity: 'common',
    coinReward: 15,
    hint: 'Keep scanning food items',
  },
  {
    id: 'scan_50',
    title: 'Food Paparazzi',
    description: 'Scan 50 food items total',
    icon: '🎬',
    rarity: 'rare',
    coinReward: 50,
    hint: 'Scan lots of food items',
  },
  {
    id: 'scan_100',
    title: 'Master Scanner',
    description: 'Scan 100 food items total',
    icon: '🔬',
    rarity: 'epic',
    coinReward: 100,
    hint: 'Become a scanning expert',
  },

  // ─── Coin Milestones ───
  {
    id: 'coins_100',
    title: 'Penny Pincher',
    description: 'Accumulate 100 coins',
    icon: '🪙',
    rarity: 'common',
    coinReward: 0, // meta — earning this from coins would be circular
    hint: 'Earn coins from challenges and achievements',
  },
  {
    id: 'coins_500',
    title: 'Coin Collector',
    description: 'Accumulate 500 coins',
    icon: '💰',
    rarity: 'rare',
    coinReward: 0,
    hint: 'Keep earning coins',
  },
  {
    id: 'coins_1000',
    title: 'Rich Pup',
    description: 'Accumulate 1000 coins',
    icon: '🤑',
    rarity: 'epic',
    coinReward: 0,
    hint: 'Become truly wealthy',
  },

  // ─── Weight Tracking ───
  {
    id: 'first_weight',
    title: 'Scale Stepper',
    description: 'Log your first weight entry',
    icon: '⚖️',
    rarity: 'common',
    coinReward: 10,
    hint: 'Log a weight entry to unlock',
  },
];

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
