import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DietType } from '../../../types';
import { styles } from '../onboardingStyles';
import { DIET_OPTIONS } from '../onboardingData';

interface Props {
  dietType: DietType;
  setDietType: (v: DietType) => void;
}

export default function DietTypeStep({ dietType, setDietType }: Props) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>🥗</Text>
      <Text style={styles.title} accessibilityRole="header">Diet Type</Text>
      <Text style={styles.subtitle}>Chester will plan meals that fit your lifestyle</Text>
      <View style={styles.chipGrid}>
        {DIET_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, dietType === opt.value && styles.chipActive]}
            onPress={() => setDietType(opt.value)}
            accessibilityLabel={opt.label}
            accessibilityRole="button"
            accessibilityState={{ selected: dietType === opt.value }}
          >
            <Text style={styles.chipIcon}>{opt.icon}</Text>
            <Text style={[styles.chipLabel, dietType === opt.value && styles.chipLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
