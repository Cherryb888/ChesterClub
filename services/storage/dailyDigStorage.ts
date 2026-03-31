import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS, getTodayKey } from './keys';
import { rollDigReward, DigReward } from '../../constants/dailyDig';
import { addCoins, activateStreakShield } from './chesterStorage';

// ─── Daily Dig State ───

export interface DailyDigState {
  /** Date of last dig (YYYY-MM-DD) */
  lastDigDate: string | null;
  /** The reward from today's dig (null if not dug yet) */
  todayReward: DigReward | null;
  /** History of all digs (id + date) for tracking collection */
  history: { rewardId: string; date: string }[];
  /** Active fun title (expires at end of day) */
  activeTitle: { text: string; expiresDate: string } | null;
  /** Whether 2x XP bone is active today */
  xpBoneActive: boolean;
  /** Unlocked dig-exclusive item IDs */
  unlockedExclusives: string[];
}

const DEFAULT_STATE: DailyDigState = {
  lastDigDate: null,
  todayReward: null,
  history: [],
  activeTitle: null,
  xpBoneActive: false,
  unlockedExclusives: [],
};

export async function getDailyDigState(): Promise<DailyDigState> {
  const raw = await AsyncStorage.getItem(KEYS.DAILY_DIG);
  if (!raw) return { ...DEFAULT_STATE };
  const state: DailyDigState = JSON.parse(raw);

  // Expire daily rewards if it's a new day
  const today = getTodayKey();
  if (state.lastDigDate !== today) {
    state.todayReward = null;
    state.xpBoneActive = false;
    if (state.activeTitle && state.activeTitle.expiresDate !== today) {
      state.activeTitle = null;
    }
  }
  return state;
}

async function saveDailyDigState(state: DailyDigState): Promise<void> {
  await AsyncStorage.setItem(KEYS.DAILY_DIG, JSON.stringify(state));
}

/**
 * Check if user can dig today.
 */
export async function canDigToday(): Promise<boolean> {
  const state = await getDailyDigState();
  return state.lastDigDate !== getTodayKey();
}

/**
 * Perform the daily dig! Returns the reward.
 * Throws if already dug today.
 */
export async function performDig(): Promise<DigReward> {
  const state = await getDailyDigState();
  const today = getTodayKey();

  if (state.lastDigDate === today) {
    throw new Error('Already dug today!');
  }

  const reward = rollDigReward();

  // Apply reward effects
  switch (reward.type) {
    case 'xp_bone':
      state.xpBoneActive = true;
      break;
    case 'streak_shield':
      await activateStreakShield();
      break;
    case 'fun_title':
      state.activeTitle = { text: reward.titleText!, expiresDate: today };
      break;
    case 'exclusive_item':
      if (reward.shopItemId && !state.unlockedExclusives.includes(reward.shopItemId)) {
        state.unlockedExclusives.push(reward.shopItemId);
      }
      break;
  }

  state.lastDigDate = today;
  state.todayReward = reward;
  state.history.push({ rewardId: reward.id, date: today });

  await saveDailyDigState(state);
  return reward;
}

/**
 * Check if 2x XP bone is active today.
 */
export async function isXpBoneActive(): Promise<boolean> {
  const state = await getDailyDigState();
  return state.xpBoneActive && state.lastDigDate === getTodayKey();
}

/**
 * Get the active fun title (if any, for today only).
 */
export async function getActiveDigTitle(): Promise<string | null> {
  const state = await getDailyDigState();
  if (state.activeTitle && state.activeTitle.expiresDate === getTodayKey()) {
    return state.activeTitle.text;
  }
  return null;
}

/**
 * Check if a dig-exclusive item has been unlocked.
 */
export async function hasUnlockedExclusive(shopItemId: string): Promise<boolean> {
  const state = await getDailyDigState();
  return state.unlockedExclusives.includes(shopItemId);
}

/**
 * Get total number of digs performed.
 */
export async function getTotalDigs(): Promise<number> {
  const state = await getDailyDigState();
  return state.history.length;
}
