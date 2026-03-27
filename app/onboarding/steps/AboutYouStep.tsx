import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Gender } from '../../../types';
import { styles } from '../onboardingStyles';
import { GENDER_OPTIONS } from '../onboardingData';

interface Props {
  name: string;
  setName: (v: string) => void;
  gender: Gender;
  setGender: (v: Gender) => void;
}

export default function AboutYouStep({ name, setName, gender, setGender }: Props) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>👋</Text>
      <Text style={styles.title}>About You</Text>
      <Text style={styles.subtitle}>What should Chester call you?</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.sectionLabel}>Gender</Text>
      <Text style={styles.sectionHint}>Helps calculate accurate calorie needs</Text>
      <View style={styles.optionGrid}>
        {GENDER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionBtn, gender === opt.value && styles.optionBtnActive]}
            onPress={() => setGender(opt.value)}
          >
            <Text style={styles.optionIcon}>{opt.icon}</Text>
            <Text style={[styles.optionLabel, gender === opt.value && styles.optionLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
