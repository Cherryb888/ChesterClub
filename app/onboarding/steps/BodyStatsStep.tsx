import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Colors } from '../../../constants/theme';
import { styles } from '../onboardingStyles';

interface Props {
  age: string; setAge: (v: string) => void;
  heightCm: string; setHeightCm: (v: string) => void;
  currentWeight: string; setCurrentWeight: (v: string) => void;
  targetWeight: string; setTargetWeight: (v: string) => void;
}

export default function BodyStatsStep({ age, setAge, heightCm, setHeightCm, currentWeight, setCurrentWeight, targetWeight, setTargetWeight }: Props) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>📏</Text>
      <Text style={styles.title} accessibilityRole="header">Body Stats</Text>
      <Text style={styles.subtitle}>Used to calculate your daily energy needs</Text>
      <View style={styles.fieldRow}>
        <View style={styles.fieldHalf}>
          <Text style={styles.fieldLabel}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="25" placeholderTextColor={Colors.textLight} accessibilityLabel="Age" accessibilityHint="Enter your age in years" />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={styles.fieldLabel}>Height (cm)</Text>
          <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder="170" placeholderTextColor={Colors.textLight} accessibilityLabel="Height in centimeters" accessibilityHint="Enter your height" />
        </View>
      </View>
      <View style={styles.fieldRow}>
        <View style={styles.fieldHalf}>
          <Text style={styles.fieldLabel}>Current Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={currentWeight}
            onChangeText={(v) => { setCurrentWeight(v); if (!targetWeight || targetWeight === currentWeight) setTargetWeight(v); }}
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor={Colors.textLight}
            accessibilityLabel="Current weight in kilograms"
            accessibilityHint="Enter your current weight"
          />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={styles.fieldLabel}>Target Weight (kg)</Text>
          <TextInput style={styles.input} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" placeholder="70" placeholderTextColor={Colors.textLight} accessibilityLabel="Target weight in kilograms" accessibilityHint="Enter your goal weight" />
        </View>
      </View>
    </View>
  );
}
