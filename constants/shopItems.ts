// ─── Shop Items ───
//
// Cosmetic items purchasable with coins. Items support either an emoji icon
// (lightweight default) or a PNG asset rendered through the cosmetic slot
// system. Categories determine the default slot; items may override.

import type { ImageSourcePropType } from 'react-native';
import type { CosmeticSlot, SlotOffset } from './cosmeticSlots';

export type ShopCategory = 'hat' | 'accessory' | 'background' | 'title' | 'consumable' | 'dig_exclusive';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopCategory;
  icon: string; // emoji representation — used as fallback or shop tile
  premium: boolean; // requires premium to purchase
  /** Optional PNG asset. When present, rendered on Chester via the slot system. */
  image?: ImageSourcePropType;
  /** Override the slot inferred from category (e.g. accessory sunglasses → 'face'). */
  slot?: CosmeticSlot;
  /** Per-item anchor tweaks layered on top of the slot default. */
  slotOffset?: SlotOffset;
}

export const SHOP_ITEMS: ShopItem[] = [
  // ─── Hats ───
  // Starter tier (~1 week of dailies)
  {
    id: 'hat_party',
    name: 'Party Hat',
    description: 'Chester loves a celebration!',
    price: 150,
    category: 'hat',
    icon: '🎉',
    premium: false,
  },
  // Mid tier (~2 weeks)
  {
    id: 'hat_cowboy',
    name: 'Cowboy Hat',
    description: 'Yeehaw! Chester rides again!',
    price: 300,
    category: 'hat',
    icon: '🤠',
    premium: false,
  },
  {
    id: 'hat_chef',
    name: 'Chef Hat',
    description: 'Chester the master chef!',
    price: 350,
    category: 'hat',
    icon: '👨‍🍳',
    premium: false,
  },
  {
    id: 'hat_santa',
    name: 'Santa Hat',
    description: 'Ho ho ho! Chester Claus!',
    price: 400,
    category: 'hat',
    icon: '🎅',
    premium: false,
  },
  // Premium tier (~1 month)
  {
    id: 'hat_wizard',
    name: 'Wizard Hat',
    description: 'Chester the magical!',
    price: 750,
    category: 'hat',
    icon: '🧙',
    premium: true,
  },
  // Aspirational tier (~2 months)
  {
    id: 'hat_crown',
    name: 'Royal Crown',
    description: 'For the king of tracking!',
    price: 1500,
    category: 'hat',
    icon: '👑',
    premium: false,
  },

  // ─── Accessories ───
  {
    id: 'acc_sunglasses',
    name: 'Cool Shades',
    description: 'Chester looking fly!',
    price: 120,
    category: 'accessory',
    icon: '😎',
    premium: false,
    slot: 'face',
  },
  {
    id: 'acc_bowtie',
    name: 'Bow Tie',
    description: 'Dapper Chester!',
    price: 200,
    category: 'accessory',
    icon: '🎀',
    premium: false,
  },
  {
    id: 'acc_scarf',
    name: 'Winter Scarf',
    description: 'Cozy Chester!',
    price: 250,
    category: 'accessory',
    icon: '🧣',
    premium: false,
  },
  {
    id: 'acc_medal',
    name: 'Gold Medal',
    description: 'A champion deserves gold!',
    price: 500,
    category: 'accessory',
    icon: '🥇',
    premium: false,
  },
  {
    id: 'acc_cape',
    name: 'Hero Cape',
    description: 'Super Chester to the rescue!',
    price: 800,
    category: 'accessory',
    icon: '🦸',
    premium: true,
    slot: 'back',
  },

  // ─── Backgrounds ───
  {
    id: 'bg_sunset',
    name: 'Sunset',
    description: 'A warm sunset behind Chester',
    price: 200,
    category: 'background',
    icon: '🌅',
    premium: false,
  },
  {
    id: 'bg_beach',
    name: 'Beach Day',
    description: 'Chester at the beach!',
    price: 300,
    category: 'background',
    icon: '🏖️',
    premium: false,
  },
  {
    id: 'bg_rainbow',
    name: 'Rainbow',
    description: 'Colorful Chester!',
    price: 450,
    category: 'background',
    icon: '🌈',
    premium: false,
  },
  {
    id: 'bg_space',
    name: 'Space Explorer',
    description: 'Chester among the stars!',
    price: 600,
    category: 'background',
    icon: '🌌',
    premium: false,
  },

  // ─── Titles ───
  {
    id: 'title_explorer',
    name: 'The Explorer',
    description: 'A title for the adventurous',
    price: 100,
    category: 'title',
    icon: '🧭',
    premium: false,
  },
  {
    id: 'title_warrior',
    name: 'Nutrition Warrior',
    description: 'A title for the dedicated',
    price: 250,
    category: 'title',
    icon: '⚔️',
    premium: false,
  },
  {
    id: 'title_legend',
    name: 'Living Legend',
    description: 'The ultimate title',
    price: 2000,
    category: 'title',
    icon: '🌟',
    premium: true,
  },

  // ─── Consumables ───
  {
    id: 'consumable_streak_shield',
    name: 'Streak Shield',
    description: 'Protects your streak if you miss one day. One-time use!',
    price: 75,
    category: 'consumable',
    icon: '🛡️',
    premium: false,
  },

  // ─── Dig Exclusives (cannot be bought, only found via Daily Dig) ───
  {
    id: 'dig_bandana',
    name: 'Chester\'s Bandana',
    description: 'A special bandana only found by digging! Super rare!',
    price: 0,
    category: 'dig_exclusive',
    icon: '🎀',
    premium: false,
  },
  {
    id: 'dig_sunflower',
    name: 'Sunflower Hat',
    description: 'A beautiful sunflower hat only found by digging! Super rare!',
    price: 0,
    category: 'dig_exclusive',
    icon: '🌻',
    premium: false,
    slot: 'hat',
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
