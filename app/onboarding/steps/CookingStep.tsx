import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CookingLevel } from '../../../types';
import { Spacing } from '../../../constants/theme';
import { styles } from '../onboardingStyles';
import { COOKING_OPTIONS, CUISINE_OPTIONS } from '../onboardingData';

interface Props {
  cookingLevel: CookingLevel;
  setCookingLevel: (v: CookingLevel) => void;
  mealsPerDay: number;
  setMealsPerDay: (v: number) => void;
  maxPrepTime: number;
  setMaxPrepTime: (v: number) => void;
  cuisines: string[];
  toggleCuisine: (id: string) => void;
}

export default function CookingStep({ cookingLevel, setCookingLevel, mealsPerDay, setMealsPerDay, maxPrepTime, setMaxPrepTime, cuisines, toggleCuisine }: Props) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>👨‍🍳</Text>
      <Text style={styles.title} accessibilityRole="header">Cooking & Preferences</Text>

      <Text style={styles.sectionLabel}>Cooking Skill</Text>
      {COOKING_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.cardOption, cookingLevel === opt.value && styles.cardOptionActive]}
          onPress={() => setCookingLevel(opt.value)}
          accessibilityLabel={`${opt.label}: ${opt.description}`}
          accessibilityRole="button"
          accessibilityState={{ selected: cookingLevel === opt.value }}
        >
          <Text style={styles.cardOptionIcon}>{opt.icon}</Text>
          <View style={styles.cardOptionText}>
            <Text style={[styles.cardOptionTitle, cookingLevel === opt.value && styles.cardOptionTitleActive]}>{opt.label}</Text>
            <Text style={[styles.cardOptionDesc, cookingLevel === opt.value && { color: '#ffffffCC' }]}>{opt.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Meals Per Day</Text>
      <View style={styles.numberRow}>
        {[3, 4, 5, 6].map(n => (
          <TouchableOpacity key={n} style={[styles.numberBtn, mealsPerDay === n && styles.numberBtnActive]} onPress={() => setMealsPerDay(n)} accessibilityLabel={`${n} meals per day`} accessibilityRole="button" accessibilityState={{ selected: mealsPerDay === n }}>
            <Text style={[styles.numberBtnText, mealsPerDay === n && styles.numberBtnTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Max Prep Time Per Meal</Text>
      <View style={styles.numberRow}>
        {[15, 30, 45, 60].map(t => (
          <TouchableOpacity key={t} style={[styles.numberBtn, maxPrepTime === t && styles.numberBtnActive]} onPress={() => setMaxPrepTime(t)} accessibilityLabel={`${t} minutes prep time`} accessibilityRole="button" accessibilityState={{ selected: maxPrepTime === t }}>
            <Text style={[styles.numberBtnText, maxPrepTime === t && styles.numberBtnTextActive]}>{t}m</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Favourite Cuisines</Text>
      <View style={styles.chipGrid}>
        {CUISINE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.chip, cuisines.includes(opt.id) && styles.chipActive]}
            onPress={() => toggleCuisine(opt.id)}
            accessibilityLabel={opt.label}
            accessibilityRole="button"
            accessibilityState={{ selected: cuisines.includes(opt.id) }}
          >
            <Text style={styles.chipIcon}>{opt.icon}</Text>
            <Text style={[styles.chipLabel, cuisines.includes(opt.id) && styles.chipLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
