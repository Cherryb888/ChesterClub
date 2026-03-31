// ─── Daily Dig Rewards ───
//
// Chester digs up a random reward once per day.
// Rarity tiers: common (70%), uncommon (20%), rare (8%), super_rare (2%)

export type DigRarity = 'common' | 'uncommon' | 'rare' | 'super_rare';

export type DigRewardType =
  | 'food_fact'
  | 'nutrition_tip'
  | 'fun_title'
  | 'xp_bone'
  | 'streak_shield'
  | 'exclusive_item';

export interface DigReward {
  id: string;
  type: DigRewardType;
  rarity: DigRarity;
  title: string;
  description: string;
  icon: string;
  /** For fun_title rewards, the title text to display */
  titleText?: string;
  /** For exclusive_item rewards, the shop item ID */
  shopItemId?: string;
}

// ─── Common: Fun Food Facts (70% of digs) ───

export const FOOD_FACTS: DigReward[] = [
  { id: 'fact_01', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Honey never spoils — archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible!' },
  { id: 'fact_02', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Avocados are technically berries, but strawberries aren\'t!' },
  { id: 'fact_03', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Bananas are slightly radioactive due to their potassium content.' },
  { id: 'fact_04', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Apples float in water because they\'re 25% air!' },
  { id: 'fact_05', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Carrots were originally purple, not orange.' },
  { id: 'fact_06', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Chocolate was once used as currency by the Aztecs.' },
  { id: 'fact_07', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Peanuts aren\'t actually nuts — they\'re legumes!' },
  { id: 'fact_08', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'It takes about 70 lbs of milk to make one pound of parmesan cheese.' },
  { id: 'fact_09', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Cranberries bounce when they\'re ripe!' },
  { id: 'fact_10', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'The world\'s most expensive pizza costs over £8,000 and is topped with caviar and gold leaf.' },
  { id: 'fact_11', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Broccoli contains more protein per calorie than steak!' },
  { id: 'fact_12', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'A single spaghetti noodle is called a "spaghetto".' },
  { id: 'fact_13', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Almonds are members of the peach family.' },
  { id: 'fact_14', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Cucumbers are 96% water — the most of any food!' },
  { id: 'fact_15', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'An egg\'s shell colour is determined by the breed of hen, not its diet.' },
  { id: 'fact_16', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Ketchup was sold as medicine in the 1830s.' },
  { id: 'fact_17', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Lemons contain more sugar than strawberries!' },
  { id: 'fact_18', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'The average person eats about 35 tonnes of food in their lifetime.' },
  { id: 'fact_19', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Popcorn can pop up to 3 feet in the air!' },
  { id: 'fact_20', type: 'food_fact', rarity: 'common', title: 'Fun Fact!', icon: '🦴', description: 'Nutmeg is a hallucinogen in large doses — don\'t try it though!' },
];

export const NUTRITION_TIPS: DigReward[] = [
  { id: 'tip_01', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Eating protein at breakfast helps reduce cravings throughout the day.' },
  { id: 'tip_02', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Drinking water before meals can help you eat less and feel full faster.' },
  { id: 'tip_03', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Fibre helps keep you full longer — aim for 25-30g per day.' },
  { id: 'tip_04', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Eating slowly gives your brain time to register fullness — try putting your fork down between bites.' },
  { id: 'tip_05', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Healthy fats (avocado, nuts, olive oil) help your body absorb vitamins A, D, E and K.' },
  { id: 'tip_06', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Colourful plates tend to be more nutritious — aim for 3+ colours in each meal.' },
  { id: 'tip_07', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Greek yoghurt has roughly double the protein of regular yoghurt.' },
  { id: 'tip_08', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Frozen vegetables are just as nutritious as fresh — sometimes more so!' },
  { id: 'tip_09', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Meal prepping on Sunday can save you 4-5 hours during the week.' },
  { id: 'tip_10', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Spices like cinnamon and turmeric have anti-inflammatory properties.' },
  { id: 'tip_11', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Sleep affects hunger hormones — poor sleep increases ghrelin (the hunger hormone).' },
  { id: 'tip_12', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Eggs are one of the most nutrient-dense foods — don\'t skip the yolk!' },
  { id: 'tip_13', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Snacking on protein (nuts, cheese, boiled eggs) beats sugary snacks for energy.' },
  { id: 'tip_14', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Your body absorbs iron better when you pair it with vitamin C.' },
  { id: 'tip_15', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Portion sizes have grown 2-3x since the 1980s — using smaller plates helps.' },
  { id: 'tip_16', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Staying hydrated helps your body burn calories more efficiently.' },
  { id: 'tip_17', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Oats are a great source of beta-glucan fibre which supports heart health.' },
  { id: 'tip_18', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Dark chocolate (70%+) is rich in antioxidants — a small square is a healthy treat!' },
  { id: 'tip_19', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Eating the same breakfast every day reduces decision fatigue and keeps you consistent.' },
  { id: 'tip_20', type: 'nutrition_tip', rarity: 'common', title: 'Nutrition Tip!', icon: '💡', description: 'Tracking what you eat makes you 2x more likely to reach your nutrition goals.' },
];

// ─── Uncommon: Fun Titles (20% of digs) ───

export const FUN_TITLES: DigReward[] = [
  { id: 'title_bone_collector', type: 'fun_title', rarity: 'uncommon', title: 'New Title!', icon: '🏷️', description: 'Chester dug up a title for you!', titleText: 'Bone Collector' },
  { id: 'title_treat_master', type: 'fun_title', rarity: 'uncommon', title: 'New Title!', icon: '🏷️', description: 'Chester dug up a title for you!', titleText: 'Treat Master' },
  { id: 'title_pawfessional', type: 'fun_title', rarity: 'uncommon', title: 'New Title!', icon: '🏷️', description: 'Chester dug up a title for you!', titleText: 'Paw-fessional' },
];

// ─── Rare: XP Bone & Streak Shield (8% of digs) ───

export const RARE_REWARDS: DigReward[] = [
  { id: 'rare_xp_bone', type: 'xp_bone', rarity: 'rare', title: 'Golden Bone!', icon: '✨🦴', description: 'Chester found a golden bone! 2x XP for the rest of today!' },
  { id: 'rare_streak_shield', type: 'streak_shield', rarity: 'rare', title: 'Streak Shield!', icon: '🛡️', description: 'Chester dug up a shield! Your streak is protected if you miss tomorrow!' },
];

// ─── Super Rare: Exclusive Dig-Only Items (2% of digs) ───

export const SUPER_RARE_REWARDS: DigReward[] = [
  { id: 'super_bandana', type: 'exclusive_item', rarity: 'super_rare', title: 'SUPER RARE Find!', icon: '🎉🐾', description: 'Chester dug up an exclusive Bandana! Check the shop!', shopItemId: 'dig_bandana' },
  { id: 'super_sunflower', type: 'exclusive_item', rarity: 'super_rare', title: 'SUPER RARE Find!', icon: '🎉🌻', description: 'Chester dug up an exclusive Sunflower Hat! Check the shop!', shopItemId: 'dig_sunflower' },
];

// ─── All rewards combined for lookup ───

export const ALL_DIG_REWARDS: DigReward[] = [
  ...FOOD_FACTS,
  ...NUTRITION_TIPS,
  ...FUN_TITLES,
  ...RARE_REWARDS,
  ...SUPER_RARE_REWARDS,
];

// ─── Rarity colours & labels ───

export const RARITY_INFO: Record<DigRarity, { color: string; label: string; glow: string }> = {
  common:     { color: '#8A9B98', label: 'Common',     glow: 'transparent' },
  uncommon:   { color: '#4ECDC4', label: 'Uncommon',   glow: 'rgba(78,205,196,0.3)' },
  rare:       { color: '#FFD700', label: 'Rare',       glow: 'rgba(255,215,0,0.4)' },
  super_rare: { color: '#FF6B6B', label: 'SUPER RARE', glow: 'rgba(255,107,107,0.5)' },
};

/**
 * Roll a random dig reward based on rarity weights.
 * common: 70%, uncommon: 20%, rare: 8%, super_rare: 2%
 */
export function rollDigReward(): DigReward {
  const roll = Math.random() * 100;

  if (roll < 2) {
    // Super rare (2%)
    return SUPER_RARE_REWARDS[Math.floor(Math.random() * SUPER_RARE_REWARDS.length)];
  } else if (roll < 10) {
    // Rare (8%)
    return RARE_REWARDS[Math.floor(Math.random() * RARE_REWARDS.length)];
  } else if (roll < 30) {
    // Uncommon (20%)
    return FUN_TITLES[Math.floor(Math.random() * FUN_TITLES.length)];
  } else {
    // Common (70%) — split evenly between facts and tips
    const pool = Math.random() < 0.5 ? FOOD_FACTS : NUTRITION_TIPS;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
