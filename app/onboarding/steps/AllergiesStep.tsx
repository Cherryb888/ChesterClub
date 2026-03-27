import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../../../constants/theme';
import { styles } from '../onboardingStyles';
import { ALLERGY_OPTIONS } from '../onboardingData';

interface Props {
  allergies: string[];
  toggleAllergy: (id: string) => void;
  dislikedFoods: string;
  setDislikedFoods: (v: string) => void;
}

export default function AllergiesStep({ allergies, toggleAllergy, dislikedFoods, setDislikedFoods }: Props) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>⚠️</Text>
      <Text style={styles.title}>Allergies & Dislikes</Text>
      <Text style={styles.subtitle}>We'll make sure to avoid these in your meal plans</Text>
      <Text style={styles.sectionLabel}>Allergies</Text>
      <View style={styles.chipGrid}>
        {ALLERGY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.chip, allergies.includes(opt.id) && styles.chipActiveRed]}
            onPress={() => toggleAllergy(opt.id)}
          >
            <Text style={styles.chipIcon}>{opt.icon}</Text>
            <Text style={[styles.chipLabel, allergies.includes(opt.id) && styles.chipLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Foods You Don't Like</Text>
      <Text style={styles.sectionHint}>Comma separated (e.g. mushrooms, olives, tofu)</Text>
      <TextInput
        style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
        placeholder="e.g. mushrooms, olives, liver"
        placeholderTextColor={Colors.textLight}
        value={dislikedFoods}
        onChangeText={setDislikedFoods}
        multiline
      />
    </View>
  );
}
