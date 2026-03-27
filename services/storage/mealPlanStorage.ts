import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan } from '../../types';
import { KEYS } from './keys';
import { getProfile, saveProfile } from './profileStorage';

export async function saveMealPlan(plan: MealPlan): Promise<void> {
  await AsyncStorage.setItem(KEYS.MEAL_PLAN, JSON.stringify(plan));

  // Award first_meal_plan achievement if not yet earned.
  // Dynamic imports break the circular dependency:
  //   mealPlanStorage → chesterStorage → foodLogStorage (no meal plan dependency)
  const { awardAchievementById } = await import('../achievementChecker');
  const { queuePendingAchievements } = await import('./chesterStorage');
  const profile = await getProfile();
  const achievement = awardAchievementById('first_meal_plan', profile.chester.achievements);
  if (achievement) {
    profile.chester.achievements.push(achievement.id);
    if (achievement.coinReward > 0) {
      profile.chester.coins += profile.isPremiumMax ? achievement.coinReward * 2 : achievement.coinReward;
    }
    await saveProfile(profile);
    await queuePendingAchievements([achievement]);
  }
}

export async function getMealPlan(): Promise<MealPlan | null> {
  const data = await AsyncStorage.getItem(KEYS.MEAL_PLAN);
  return data ? JSON.parse(data) : null;
}
