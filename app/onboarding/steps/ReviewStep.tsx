import React from 'react';
import { View, Text } from 'react-native';
import { FitnessGoal, DietType, CookingLevel } from '../../../types';
import { Colors } from '../../../constants/theme';
import { styles } from '../onboardingStyles';
import { GOAL_OPTIONS, DIET_OPTIONS, COOKING_OPTIONS } from '../onboardingData';

interface Props {
  goalCalories: number;
  tdee: number;
  fitnessGoal: FitnessGoal;
  macros: { protein: number; carbs: number; fat: number };
  waterGoal: number;
  dietType: DietType;
  cookingLevel: CookingLevel;
  mealsPerDay: number;
  maxPrepTime: number;
  allergies: string[];
  cuisines: string[];
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewRowLabel}>{label}</Text>
      <Text style={styles.reviewRowValue}>{value}</Text>
    </View>
  );
}

export default function ReviewStep({ goalCalories, tdee, fitnessGoal, macros, waterGoal, dietType, cookingLevel, mealsPerDay, maxPrepTime, allergies, cuisines }: Props) {
  const goalSuffix = fitnessGoal === 'lose_weight' ? '(-400 deficit)' : fitnessGoal === 'gain_muscle' ? '(+300 surplus)' : '(maintenance)';
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>✅</Text>
      <Text style={styles.title}>Your Plan</Text>
      <Text style={styles.subtitle}>Chester calculated your personalised targets</Text>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>Daily Calories</Text>
        <Text style={styles.reviewValue}>{goalCalories} cal</Text>
        <Text style={styles.reviewHint}>TDEE: {tdee} cal {goalSuffix}</Text>
      </View>

      <View style={styles.reviewMacros}>
        <View style={[styles.reviewMacroBox, { borderColor: Colors.protein }]}>
          <Text style={[styles.reviewMacroValue, { color: Colors.protein }]}>{macros.protein}g</Text>
          <Text style={styles.reviewMacroLabel}>Protein</Text>
        </View>
        <View style={[styles.reviewMacroBox, { borderColor: Colors.carbs }]}>
          <Text style={[styles.reviewMacroValue, { color: Colors.carbs }]}>{macros.carbs}g</Text>
          <Text style={styles.reviewMacroLabel}>Carbs</Text>
        </View>
        <View style={[styles.reviewMacroBox, { borderColor: Colors.fat }]}>
          <Text style={[styles.reviewMacroValue, { color: Colors.fat }]}>{macros.fat}g</Text>
          <Text style={styles.reviewMacroLabel}>Fat</Text>
        </View>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>Daily Water</Text>
        <Text style={styles.reviewValue}>{waterGoal} glasses 💧</Text>
      </View>

      <View style={styles.reviewSummary}>
        <ReviewRow label="Goal"       value={GOAL_OPTIONS.find(g => g.value === fitnessGoal)?.label || ''} />
        <ReviewRow label="Diet"       value={DIET_OPTIONS.find(d => d.value === dietType)?.label || ''} />
        <ReviewRow label="Cooking"    value={COOKING_OPTIONS.find(c => c.value === cookingLevel)?.label || ''} />
        <ReviewRow label="Meals/day"  value={`${mealsPerDay}`} />
        <ReviewRow label="Max prep"   value={`${maxPrepTime} min`} />
        {allergies.length > 0 && <ReviewRow label="Allergies" value={allergies.join(', ')} />}
        {cuisines.length > 0  && <ReviewRow label="Cuisines"  value={cuisines.join(', ')} />}
      </View>

      <Text style={styles.reviewNote}>
        You can change any of these later in Settings. Premium users get personalised weekly meal plans based on this profile.
      </Text>
    </View>
  );
}
