import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserGoals, ChesterState, DietProfile } from '../../types';
import { smartSync } from '../syncQueue';
import { KEYS } from './keys';

// ─── Defaults ───

export const DEFAULT_GOALS: UserGoals = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 200,
  dailyFat: 65,
  dailyWaterGlasses: 8,
};

export const DEFAULT_DIET_PROFILE: DietProfile = {
  gender: 'prefer_not_to_say',
  age: 25,
  heightCm: 170,
  currentWeightKg: 70,
  targetWeightKg: 70,
  fitnessGoal: 'maintain',
  dietType: 'no_restriction',
  allergies: [],
  dislikedFoods: [],
  cookingLevel: 'intermediate',
  mealsPerDay: 3,
  maxPrepTimeMinutes: 30,
  cuisinePreferences: [],
};

export const DEFAULT_CHESTER: ChesterState = {
  level: 1,
  xp: 0,
  mood: 'happy',
  streak: 0,
  lastFedDate: null,
  outfit: 'default',
  health: 70,
  achievements: [],
  coins: 0,
  previousStreak: 0,
  streakShieldActive: false,
};

// ─── Profile CRUD ───

export async function getProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(KEYS.PROFILE);
  if (data) {
    const profile = JSON.parse(data);
    // Defensive field normalisation (migrations handle this, but guards against
    // cloud-pulled data that might be missing newer fields)
    if (!profile.chester) profile.chester = DEFAULT_CHESTER;
    if (profile.chester.health === undefined) profile.chester.health = 70;
    if (!profile.chester.achievements) profile.chester.achievements = [];
    if (profile.chester.coins === undefined) profile.chester.coins = 0;
    if (!profile.goals) profile.goals = DEFAULT_GOALS;
    if (profile.goals.dailyWaterGlasses === undefined) profile.goals.dailyWaterGlasses = 8;
    if (profile.isPremiumMax === undefined) profile.isPremiumMax = false;
    if (profile.isPremiumMax && !profile.subscription) profile.subscription = undefined;
    if (profile.chester.previousStreak === undefined) profile.chester.previousStreak = 0;
    if (profile.chester.streakShieldActive === undefined) profile.chester.streakShieldActive = false;
    if (!profile.weightHistory) profile.weightHistory = [];
    if (!profile.dietProfile) profile.dietProfile = DEFAULT_DIET_PROFILE;
    return profile;
  }
  const profile: UserProfile = {
    uid: 'local_user',
    email: '',
    displayName: 'Friend',
    goals: DEFAULT_GOALS,
    dietProfile: DEFAULT_DIET_PROFILE,
    chester: DEFAULT_CHESTER,
    createdAt: Date.now(),
    onboardingComplete: false,
    weightHistory: [],
    isPremiumMax: false,
  };
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  return profile;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  smartSync({ type: 'profile' }).catch(() => {});
}

export async function updateGoals(goals: UserGoals): Promise<void> {
  const profile = await getProfile();
  profile.goals = goals;
  await saveProfile(profile);
}

// ─── Onboarding ───

export async function isOnboardingComplete(): Promise<boolean> {
  const profile = await getProfile();
  return profile.onboardingComplete;
}

export async function completeOnboarding(): Promise<void> {
  const profile = await getProfile();
  profile.onboardingComplete = true;
  await saveProfile(profile);
}
