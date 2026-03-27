import { Gender, FitnessGoal, DietType, CookingLevel } from '../../types';

export const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male',              label: 'Male',              icon: '♂️' },
  { value: 'female',            label: 'Female',            icon: '♀️' },
  { value: 'other',             label: 'Other',             icon: '⚧️' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🙂' },
];

export const GOAL_OPTIONS: { value: FitnessGoal; label: string; icon: string; description: string }[] = [
  { value: 'lose_weight',    label: 'Lose Weight',   icon: '⬇️', description: 'Reduce body fat while staying healthy' },
  { value: 'maintain',       label: 'Maintain',      icon: '⚖️', description: 'Keep current weight, eat balanced' },
  { value: 'gain_muscle',    label: 'Build Muscle',  icon: '💪', description: 'Gain lean mass with higher protein' },
  { value: 'improve_health', label: 'Eat Healthier', icon: '🥗', description: 'Focus on nutrition quality' },
];

export const DIET_OPTIONS: { value: DietType; label: string; icon: string }[] = [
  { value: 'no_restriction', label: 'No Restrictions', icon: '🍽️' },
  { value: 'vegetarian',     label: 'Vegetarian',      icon: '🥬' },
  { value: 'vegan',          label: 'Vegan',           icon: '🌱' },
  { value: 'pescatarian',    label: 'Pescatarian',     icon: '🐟' },
  { value: 'keto',           label: 'Keto',            icon: '🥑' },
  { value: 'paleo',          label: 'Paleo',           icon: '🥩' },
  { value: 'mediterranean',  label: 'Mediterranean',   icon: '🫒' },
  { value: 'halal',          label: 'Halal',           icon: '☪️' },
  { value: 'kosher',         label: 'Kosher',          icon: '✡️' },
];

export const ALLERGY_OPTIONS = [
  { id: 'nuts',      label: 'Nuts',      icon: '🥜' },
  { id: 'dairy',     label: 'Dairy',     icon: '🥛' },
  { id: 'gluten',    label: 'Gluten',    icon: '🌾' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'eggs',      label: 'Eggs',      icon: '🥚' },
  { id: 'soy',       label: 'Soy',       icon: '🫘' },
  { id: 'fish',      label: 'Fish',      icon: '🐟' },
  { id: 'sesame',    label: 'Sesame',    icon: '🫘' },
];

export const CUISINE_OPTIONS = [
  { id: 'italian',        label: 'Italian',        icon: '🍝' },
  { id: 'asian',          label: 'Asian',          icon: '🍜' },
  { id: 'mexican',        label: 'Mexican',        icon: '🌮' },
  { id: 'indian',         label: 'Indian',         icon: '🍛' },
  { id: 'american',       label: 'American',       icon: '🍔' },
  { id: 'japanese',       label: 'Japanese',       icon: '🍣' },
  { id: 'mediterranean',  label: 'Mediterranean',  icon: '🥙' },
  { id: 'korean',         label: 'Korean',         icon: '🥘' },
  { id: 'thai',           label: 'Thai',           icon: '🍲' },
  { id: 'middle_eastern', label: 'Middle Eastern', icon: '🧆' },
];

export const COOKING_OPTIONS: { value: CookingLevel; label: string; description: string; icon: string }[] = [
  { value: 'beginner',     label: 'Beginner',     description: 'Simple recipes, minimal prep',   icon: '🔰' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable in the kitchen',     icon: '👨‍🍳' },
  { value: 'advanced',     label: 'Advanced',     description: 'Love complex recipes',           icon: '⭐' },
];

export const ACTIVITY_LEVELS = [
  { label: 'Sedentary',          description: 'Desk job, little exercise',          factor: 1.2 },
  { label: 'Lightly Active',     description: 'Light exercise 1-3 days/week',       factor: 1.375 },
  { label: 'Moderately Active',  description: 'Exercise 3-5 days/week',             factor: 1.55 },
  { label: 'Very Active',        description: 'Hard exercise 6-7 days/week',        factor: 1.725 },
];
