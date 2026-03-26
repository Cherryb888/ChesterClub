// ─── Shop Items ───
//
// Cosmetic items purchasable with coins. Emoji-based for MVP.
// Categories determine where the cosmetic renders on Chester.

export type ShopCategory = 'hat' | 'accessory' | 'background' | 'title';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopCategory;
  icon: string; // emoji representation
  premium: boolean; // requires premium to purchase
}

export const SHOP_ITEMS: ShopItem[] = [
  // ─── Hats ───
  {
    id: 'hat_party',
    name: 'Party Hat',
    description: 'Chester loves a celebration!',
    price: 30,
    category: 'hat',
    icon: '🎉',
    premium: false,
  },
  {
    id: 'hat_cowboy',
    name: 'Cowboy Hat',
    description: 'Yeehaw! Chester rides again!',
    price: 50,
    category: 'hat',
    icon: '🤠',
    premium: false,
  },
  {
    id: 'hat_chef',
    name: 'Chef Hat',
    description: 'Chester the master chef!',
    price: 60,
    category: 'hat',
    icon: '👨‍🍳',
    premium: false,
  },
  {
    id: 'hat_crown',
    name: 'Royal Crown',
    description: 'For the king of tracking!',
    price: 200,
    category: 'hat',
    icon: '👑',
    premium: false,
  },
  {
    id: 'hat_santa',
    name: 'Santa Hat',
    description: 'Ho ho ho! Chester Claus!',
    price: 80,
    category: 'hat',
    icon: '🎅',
    premium: false,
  },
  {
    id: 'hat_wizard',
    name: 'Wizard Hat',
    description: 'Chester the magical!',
    price: 150,
    category: 'hat',
    icon: '🧙',
    premium: true,
  },

  // ─── Accessories ───
  {
    id: 'acc_sunglasses',
    name: 'Cool Shades',
    description: 'Chester looking fly!',
    price: 25,
    category: 'accessory',
    icon: '😎',
    premium: false,
  },
  {
    id: 'acc_bowtie',
    name: 'Bow Tie',
    description: 'Dapper Chester!',
    price: 35,
    category: 'accessory',
    icon: '🎀',
    premium: false,
  },
  {
    id: 'acc_medal',
    name: 'Gold Medal',
    description: 'A champion deserves gold!',
    price: 100,
    category: 'accessory',
    icon: '🥇',
    premium: false,
  },
  {
    id: 'acc_scarf',
    name: 'Winter Scarf',
    description: 'Cozy Chester!',
    price: 40,
    category: 'accessory',
    icon: '🧣',
    premium: false,
  },
  {
    id: 'acc_cape',
    name: 'Hero Cape',
    description: 'Super Chester to the rescue!',
    price: 120,
    category: 'accessory',
    icon: '🦸',
    premium: true,
  },

  // ─── Backgrounds ───
  {
    id: 'bg_sunset',
    name: 'Sunset',
    description: 'A warm sunset behind Chester',
    price: 40,
    category: 'background',
    icon: '🌅',
    premium: false,
  },
  {
    id: 'bg_beach',
    name: 'Beach Day',
    description: 'Chester at the beach!',
    price: 50,
    category: 'background',
    icon: '🏖️',
    premium: false,
  },
  {
    id: 'bg_space',
    name: 'Space Explorer',
    description: 'Chester among the stars!',
    price: 100,
    category: 'background',
    icon: '🌌',
    premium: false,
  },
  {
    id: 'bg_rainbow',
    name: 'Rainbow',
    description: 'Colorful Chester!',
    price: 75,
    category: 'background',
    icon: '🌈',
    premium: false,
  },

  // ─── Titles ───
  {
    id: 'title_explorer',
    name: 'The Explorer',
    description: 'A title for the adventurous',
    price: 20,
    category: 'title',
    icon: '🧭',
    premium: false,
  },
  {
    id: 'title_warrior',
    name: 'Nutrition Warrior',
    description: 'A title for the dedicated',
    price: 30,
    category: 'title',
    icon: '⚔️',
    premium: false,
  },
  {
    id: 'title_legend',
    name: 'Living Legend',
    description: 'The ultimate title',
    price: 300,
    category: 'title',
    icon: '🌟',
    premium: true,
  },
];

export const BACKGROUND_COLORS: Record<string, string[]> = {
  bg_sunset: ['#FF6B35', '#FFB366', '#FFF3E0'],
  bg_beach: ['#4FC3F7', '#81D4FA', '#E1F5FE'],
  bg_space: ['#1A237E', '#311B92', '#4A148C'],
  bg_rainbow: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
};

export function getShopItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.id === id);
}
