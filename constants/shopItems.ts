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
  // ─── Hats (15) ───
  // Starter tier (~1 week of dailies)
  { id: 'hat_party',         name: 'Party Hat',     description: 'Chester loves a celebration!',     price: 150,  category: 'hat', icon: '🎉', premium: false },
  { id: 'hat_baseball',      name: 'Baseball Cap',  description: 'Backwards or forwards — your call.', price: 180,  category: 'hat', icon: '🧢', premium: false },
  { id: 'hat_beanie',        name: 'Cosy Beanie',   description: 'Warm head, warm heart.',            price: 200,  category: 'hat', icon: '🪖', premium: false },
  // Mid tier (~2 weeks)
  { id: 'hat_cowboy',        name: 'Cowboy Hat',    description: 'Yeehaw! Chester rides again!',     price: 300,  category: 'hat', icon: '🤠', premium: false },
  { id: 'hat_chef',          name: 'Chef Hat',      description: 'Chester the master chef!',         price: 350,  category: 'hat', icon: '👨‍🍳', premium: false },
  { id: 'hat_pirate',        name: 'Pirate Hat',    description: 'Yarrr! There be biscuits.',        price: 380,  category: 'hat', icon: '🏴‍☠️', premium: false },
  { id: 'hat_santa',         name: 'Santa Hat',     description: 'Ho ho ho! Chester Claus!',         price: 400,  category: 'hat', icon: '🎅', premium: false },
  { id: 'hat_top',           name: 'Top Hat',       description: 'Distinguished gentleman vibes.',   price: 450,  category: 'hat', icon: '🎩', premium: false },
  { id: 'hat_viking',        name: 'Viking Helm',   description: 'Conquer the kitchen.',             price: 550,  category: 'hat', icon: '⚔️', premium: false },
  { id: 'hat_witch',         name: 'Witch Hat',     description: 'Spooky season unlocked.',          price: 600,  category: 'hat', icon: '🧙‍♀️', premium: false },
  // Premium tier (~1 month)
  { id: 'hat_wizard',        name: 'Wizard Hat',    description: 'Chester the magical!',             price: 750,  category: 'hat', icon: '🧙', premium: true },
  { id: 'hat_birthday_cake', name: 'Birthday Cake', description: 'Wear your wins on your head.',     price: 1000, category: 'hat', icon: '🎂', premium: true },
  { id: 'hat_unicorn_horn',  name: 'Unicorn Horn',  description: 'Mythically nutritious.',           price: 1200, category: 'hat', icon: '🦄', premium: false },
  { id: 'hat_halo',          name: 'Halo',          description: 'A perfect day deserves it.',       price: 1400, category: 'hat', icon: '😇', premium: false },
  // Aspirational tier (~2 months)
  { id: 'hat_crown',         name: 'Royal Crown',   description: 'For the king of tracking!',        price: 1500, category: 'hat', icon: '👑', premium: false },

  // ─── Accessories (12) ───
  { id: 'acc_sunglasses',    name: 'Cool Shades',     description: 'Chester looking fly!',          price: 120,  category: 'accessory', icon: '😎', premium: false, slot: 'face' },
  { id: 'acc_bowtie',        name: 'Bow Tie',         description: 'Dapper Chester!',               price: 200,  category: 'accessory', icon: '🎀', premium: false },
  { id: 'acc_scarf',         name: 'Winter Scarf',    description: 'Cozy Chester!',                 price: 250,  category: 'accessory', icon: '🧣', premium: false },
  { id: 'acc_headphones',    name: 'Headphones',      description: 'Chef beats while you log.',     price: 320,  category: 'accessory', icon: '🎧', premium: false, slot: 'face' },
  { id: 'acc_monocle',       name: 'Monocle',         description: 'Indeed, most distinguished.',   price: 400,  category: 'accessory', icon: '🧐', premium: false, slot: 'face' },
  { id: 'acc_snorkel',       name: 'Snorkel Set',     description: 'Hydration mode: maximum.',      price: 450,  category: 'accessory', icon: '🤿', premium: false, slot: 'face' },
  { id: 'acc_medal',         name: 'Gold Medal',      description: 'A champion deserves gold!',     price: 500,  category: 'accessory', icon: '🥇', premium: false },
  { id: 'acc_neck_tie',      name: 'Necktie',         description: 'For the executive eater.',      price: 550,  category: 'accessory', icon: '👔', premium: false },
  { id: 'acc_pearl_collar',  name: 'Pearl Collar',    description: 'A lustrous classic.',           price: 700,  category: 'accessory', icon: '💍', premium: false },
  { id: 'acc_cape',          name: 'Hero Cape',       description: 'Super Chester to the rescue!',  price: 800,  category: 'accessory', icon: '🦸', premium: true,  slot: 'back' },
  { id: 'acc_butterfly_wings', name: 'Butterfly Wings', description: 'Flutter into the kitchen.',  price: 1000, category: 'accessory', icon: '🦋', premium: true,  slot: 'back' },
  { id: 'acc_glow_collar',   name: 'Glow Collar',     description: 'Lights up the room.',           price: 1500, category: 'accessory', icon: '✨', premium: true },

  // ─── Backgrounds (10) ───
  { id: 'bg_sunset',         name: 'Sunset',          description: 'A warm sunset behind Chester.',  price: 200,  category: 'background', icon: '🌅', premium: false },
  { id: 'bg_beach',          name: 'Beach Day',       description: 'Chester at the beach!',          price: 300,  category: 'background', icon: '🏖️', premium: false },
  { id: 'bg_garden',         name: 'Garden Patch',    description: 'Fresh herbs, fresh start.',      price: 350,  category: 'background', icon: '🌿', premium: false },
  { id: 'bg_forest',         name: 'Pine Forest',     description: 'Cool, calm and woodsy.',         price: 400,  category: 'background', icon: '🌲', premium: false },
  { id: 'bg_rainbow',        name: 'Rainbow',         description: 'Colourful Chester!',             price: 450,  category: 'background', icon: '🌈', premium: false },
  { id: 'bg_kennel',         name: 'Cosy Kennel',     description: 'Home sweet home.',               price: 500,  category: 'background', icon: '🏠', premium: false },
  { id: 'bg_snowy',          name: 'Snowy Peaks',     description: 'Crisp, fresh, refreshing.',      price: 550,  category: 'background', icon: '❄️', premium: false },
  { id: 'bg_space',          name: 'Space Explorer',  description: 'Chester among the stars!',       price: 600,  category: 'background', icon: '🌌', premium: false },
  { id: 'bg_aurora',         name: 'Aurora Night',    description: 'Northern lights, southern dog.', price: 800,  category: 'background', icon: '🌠', premium: false },
  { id: 'bg_galaxy',         name: 'Galaxy Swirl',    description: 'A cosmic centrepiece.',          price: 1200, category: 'background', icon: '💫', premium: true },

  // ─── Titles (8) ───
  { id: 'title_explorer',    name: 'The Explorer',         description: 'A title for the adventurous.',   price: 100,  category: 'title', icon: '🧭', premium: false },
  { id: 'title_warrior',     name: 'Nutrition Warrior',    description: 'A title for the dedicated.',      price: 250,  category: 'title', icon: '⚔️', premium: false },
  { id: 'title_hydrator',    name: 'Hydration Hero',       description: 'Glug glug glug.',                 price: 300,  category: 'title', icon: '💧', premium: false },
  { id: 'title_gourmet',     name: 'Gourmet Tail',         description: 'Refined palate.',                 price: 400,  category: 'title', icon: '🍴', premium: false },
  { id: 'title_early_bird',  name: 'Early Bird',           description: 'Catches the breakfast.',          price: 500,  category: 'title', icon: '🌅', premium: false },
  { id: 'title_night_owl',   name: 'Night Owl',            description: 'Logs after midnight, no judgement.', price: 500, category: 'title', icon: '🦉', premium: false },
  { id: 'title_founder',     name: 'Founding Member',      description: 'Day-one ChesterClub legend.',     price: 1000, category: 'title', icon: '🏅', premium: false },
  { id: 'title_legend',      name: 'Living Legend',        description: 'The ultimate title.',             price: 2000, category: 'title', icon: '🌟', premium: true },

  // ─── Consumables ───
  { id: 'consumable_streak_shield', name: 'Streak Shield', description: 'Protects your streak if you miss one day. One-time use!', price: 75, category: 'consumable', icon: '🛡️', premium: false },

  // ─── Dig Exclusives (cannot be bought, only found via Daily Dig) ───
  { id: 'dig_bandana',       name: "Chester's Bandana",    description: 'A special bandana only found by digging! Super rare!', price: 0, category: 'dig_exclusive', icon: '🎀', premium: false },
  { id: 'dig_sunflower',     name: 'Sunflower Hat',        description: 'A beautiful sunflower hat only found by digging! Super rare!', price: 0, category: 'dig_exclusive', icon: '🌻', premium: false, slot: 'hat' },
];

// Background gradients used by ChesterAvatar's container tint and the
// home-screen scene. Order: outer → inner (3-stop) or 4-stop for rainbow.
export const BACKGROUND_COLORS: Record<string, string[]> = {
  bg_sunset:  ['#FF6B35', '#FFB366', '#FFF3E0'],
  bg_beach:   ['#4FC3F7', '#81D4FA', '#E1F5FE'],
  bg_garden:  ['#7DCFB6', '#A0E7E5', '#E4F9F5'],
  bg_forest:  ['#2D5016', '#5C8B3A', '#A4C3A2'],
  bg_rainbow: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
  bg_kennel:  ['#8B6F47', '#C4A57B', '#F4E8D8'],
  bg_snowy:   ['#5DA3FA', '#A8D5FF', '#F0F8FF'],
  bg_space:   ['#1A237E', '#311B92', '#4A148C'],
  bg_aurora:  ['#0F2027', '#2C5364', '#22A98C'],
  bg_galaxy:  ['#10002B', '#7B2CBF', '#E0AAFF'],
};

export function getShopItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.id === id);
}
