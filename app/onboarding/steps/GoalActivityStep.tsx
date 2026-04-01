import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FitnessGoal } from '../../../types';
import { Spacing } from '../../../constants/theme';
import { styles } from '../onboardingStyles';
import { GOAL_OPTIONS, ACTIVITY_LEVELS } from '../onboardingData';

interface Props {
  fitnessGoal: FitnessGoal;
  setFitnessGoal: (v: FitnessGoal) => void;
  activityLevel: number;
  setActivityLevel: (v: number) => void;
}

export default function GoalActivityStep({ fitnessGoal, setFitnessGoal, activityLevel, setActivityLevel }: Props) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>🎯</Text>
      <Text style={styles.title} accessibilityRole="header">Your Goal</Text>
      {GOAL_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.cardOption, fitnessGoal === opt.value && styles.cardOptionActive]}
          onPress={() => setFitnessGoal(opt.value)}
          accessibilityLabel={`${opt.label}: ${opt.description}`}
          accessibilityRole="button"
          accessibilityState={{ selected: fitnessGoal === opt.value }}
        >
          <Text style={styles.cardOptionIcon}>{opt.icon}</Text>
          <View style={styles.cardOptionText}>
            <Text style={[styles.cardOptionTitle, fitnessGoal === opt.value && styles.cardOptionTitleActive]}>{opt.label}</Text>
            <Text style={[styles.cardOptionDesc, fitnessGoal === opt.value && { color: '#ffffffCC' }]}>{opt.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Activity Level</Text>
      {ACTIVITY_LEVELS.map((level, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.cardOption, activityLevel === idx && styles.cardOptionActive]}
          onPress={() => setActivityLevel(idx)}
          accessibilityLabel={`${level.label}: ${level.description}`}
          accessibilityRole="button"
          accessibilityState={{ selected: activityLevel === idx }}
        >
          <View style={styles.cardOptionText}>
            <Text style={[styles.cardOptionTitle, activityLevel === idx && styles.cardOptionTitleActive]}>{level.label}</Text>
            <Text style={[styles.cardOptionDesc, activityLevel === idx && { color: '#ffffffCC' }]}>{level.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
