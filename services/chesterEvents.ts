// ─── Chester Event Bus ───
//
// Tiny pub/sub used by the storage layer to surface user actions (food
// logged, water logged, dig completed, etc.) without depending on React.
// The reaction context subscribes to these events and renders a popup +
// fires the corresponding animation trigger.
//
// Storage code emits, UI code subscribes — strict one-way, no cycles.

import type { AchievementDefinition } from '../constants/achievements';
import type { StreakMilestone } from '../constants/streakRewards';
import type { DigReward } from '../constants/dailyDig';
import type { ShopCategory } from '../constants/shopItems';

export type ChesterEvent =
  | {
      type: 'chester_fed';
      score: 'great' | 'good' | 'okay' | 'poor';
      newLevel: number;
      leveledUp: boolean;
      newStreak: number;
      streakIncreased: boolean;
    }
  | { type: 'achievement_unlocked'; achievement: AchievementDefinition }
  | { type: 'streak_milestone'; milestone: StreakMilestone }
  | { type: 'water_logged'; glasses: number; goalReached: boolean }
  | { type: 'dig_completed'; reward: DigReward }
  | { type: 'shop_purchase'; itemId: string; itemName: string; category: ShopCategory }
  | { type: 'cosmetic_equipped'; itemName: string; category: ShopCategory }
  | { type: 'chester_petted'; mood: 'happy' | 'excited' | 'neutral' | 'hungry' | 'sleepy' | 'sad' };

type Listener = (event: ChesterEvent) => void;

const listeners = new Set<Listener>();

export function subscribeChesterEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function emitChesterEvent(event: ChesterEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (err) {
      // Never let one listener break the rest
      // eslint-disable-next-line no-console
      console.error('[chesterEvents] listener threw', err);
    }
  }
}
