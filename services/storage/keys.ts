export const KEYS = {
  PROFILE: 'user_profile',
  LOG_PREFIX: 'food_log_',
  ONBOARDING: 'onboarding_complete',
  MEAL_PLAN: 'current_meal_plan',
  WATER_PREFIX: 'water_log_',
  CHALLENGES: 'challenges_state',
  SCHEMA_VERSION: 'schema_version',
  TOTAL_SCANS: 'total_food_scans',
  PENDING_ACHIEVEMENTS: 'pending_achievement_unlocks',
  PENDING_MILESTONE: 'pending_streak_milestone',
};

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}
