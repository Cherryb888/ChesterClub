// Barrel re-export — all existing imports of 'services/storage' continue to work.

export { KEYS, getTodayKey } from './keys';
export { runMigrations, getSchemaVersion } from './migrations';
export {
  DEFAULT_GOALS,
  DEFAULT_DIET_PROFILE,
  DEFAULT_CHESTER,
  getProfile,
  saveProfile,
  updateGoals,
  isOnboardingComplete,
  completeOnboarding,
} from './profileStorage';
export {
  getChesterLifeStage,
  LIFE_STAGE_INFO,
  getChester,
  updateChester,
  addCoins,
  incrementTotalScans,
  getTotalScans,
  getPendingAchievements,
  popPendingAchievement,
  queuePendingAchievements,
  getPendingMilestone,
  activateStreakShield,
  isStreakShieldActive,
  getStreakRecoveryCost,
  checkStreakRecoveryAvailable,
  recoverStreak,
  dismissStreakRecovery,
  getWeeklyStats,
  feedChester,
  checkChesterDecay,
} from './chesterStorage';
export { getWaterLog, addWaterGlass, removeWaterGlass } from './waterStorage';
export {
  getDailyLog,
  addFoodToLog,
  removeFoodFromLog,
  getWeekLogs,
  getMonthLogs,
  getTotalMealsLogged,
  getRecentFoods,
  addRecentFood,
} from './foodLogStorage';
export { saveMealPlan, getMealPlan } from './mealPlanStorage';
export { addWeightEntry, getWeightHistory, deleteWeightEntry } from './weightStorage';
export type { WeightEntry } from './weightStorage';
export {
  DAILY_CHALLENGES,
  WEEKLY_CHALLENGES,
  MONTHLY_CHALLENGES,
  ALL_TIME_CHALLENGES,
  getChallengesState,
  updateChallengeProgress,
  claimChallengeReward,
  refreshChallengeProgress,
} from './challengesStorage';
export { getSettings, saveSettings, exportAllData } from './settingsStorage';
export type { AppSettings } from './settingsStorage';

// Re-export nutrition utilities (previously re-exported from the old storage.ts)
export { calculateNutritionScore } from '../../utils/nutrition';
