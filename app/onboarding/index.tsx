import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { completeOnboarding, saveProfile, getProfile } from '../../services/storage';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    emoji: 'chester',
    title: 'Meet Chester!',
    subtitle: 'Your golden retriever food tracking buddy. Chester will help you stay on top of your nutrition!',
  },
  {
    emoji: '📸',
    title: 'Snap & Track',
    subtitle: 'Take a photo of any meal and Chester\'s AI will identify the food and track calories & macros instantly!',
  },
  {
    emoji: '💧',
    title: 'Stay Hydrated',
    subtitle: 'Chester will track your water intake too! Tell us about yourself so we can calculate your ideal daily water goal.',
  },
  {
    emoji: '🎯',
    title: 'Set Your Goals',
    subtitle: 'Tell Chester your daily targets and he\'ll help you stay on track. Let\'s set them up!',
  },
];

const ACTIVITY_LEVELS = [
  { label: 'Sedentary', description: 'Desk job, little exercise', multiplier: 1.0 },
  { label: 'Light', description: 'Light exercise 1-3 days/week', multiplier: 1.15 },
  { label: 'Moderate', description: 'Exercise 3-5 days/week', multiplier: 1.3 },
  { label: 'Active', description: 'Hard exercise 6-7 days/week', multiplier: 1.5 },
];

function calculateWaterGlasses(weightKg: number, activityMultiplier: number): number {
  // Base: 30-35ml per kg of body weight, adjusted for activity
  // A glass = ~250ml
  const baseml = weightKg * 33 * activityMultiplier;
  return Math.round(baseml / 250);
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('150');
  const [carbs, setCarbs] = useState('200');
  const [fat, setFat] = useState('65');
  const [weight, setWeight] = useState('70');
  const [activityLevel, setActivityLevel] = useState(1); // index into ACTIVITY_LEVELS

  const waterGoal = calculateWaterGlasses(
    parseInt(weight) || 70,
    ACTIVITY_LEVELS[activityLevel].multiplier
  );

  const finish = async () => {
    const profile = await getProfile();
    profile.displayName = name || 'Friend';
    profile.goals = {
      dailyCalories: parseInt(calories) || 2000,
      dailyProtein: parseInt(protein) || 150,
      dailyCarbs: parseInt(carbs) || 200,
      dailyFat: parseInt(fat) || 65,
      dailyWaterGlasses: waterGoal,
    };
    profile.onboardingComplete = true;
    await saveProfile(profile);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const isLastPage = page === PAGES.length - 1;
  const isWaterPage = page === 2;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page content */}
        <View style={styles.content}>
          {PAGES[page].emoji === 'chester' ? (
            <View style={styles.chesterOnboard}>
              <Image
                source={require('../../assets/chester/chester-happy.png')}
                style={styles.chesterOnboardImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            <Text style={styles.emoji}>{PAGES[page].emoji}</Text>
          )}
          <Text style={styles.title}>{PAGES[page].title}</Text>
          <Text style={styles.subtitle}>{PAGES[page].subtitle}</Text>

          {/* Water/body info page */}
          {isWaterPage && (
            <View style={styles.form}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Your weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  placeholderTextColor={Colors.textLight}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.inputLabel}>Activity level</Text>
              <View style={styles.activityGrid}>
                {ACTIVITY_LEVELS.map((level, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.activityBtn, activityLevel === idx && styles.activityBtnActive]}
                    onPress={() => setActivityLevel(idx)}
                  >
                    <Text style={[styles.activityLabel, activityLevel === idx && styles.activityLabelActive]}>
                      {level.label}
                    </Text>
                    <Text style={[styles.activityDesc, activityLevel === idx && { color: '#fff' }]}>
                      {level.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.waterResult}>
                <Text style={styles.waterIcon}>💧</Text>
                <Text style={styles.waterGoalText}>Your daily water goal:</Text>
                <Text style={styles.waterGoalNumber}>{waterGoal} glasses</Text>
                <Text style={styles.waterGoalSub}>({waterGoal * 250}ml / {(waterGoal * 250 / 1000).toFixed(1)}L per day)</Text>
              </View>
            </View>
          )}

          {/* Goals form on last page */}
          {isLastPage && (
            <View style={styles.form}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Your name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What should Chester call you?"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={styles.goalsGrid}>
                <GoalInput label="Calories" value={calories} onChange={setCalories} color={Colors.calories} unit="cal" />
                <GoalInput label="Protein" value={protein} onChange={setProtein} color={Colors.protein} unit="g" />
                <GoalInput label="Carbs" value={carbs} onChange={setCarbs} color={Colors.carbs} unit="g" />
                <GoalInput label="Fat" value={fat} onChange={setFat} color={Colors.fat} unit="g" />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        {page > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => setPage(page - 1)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={isLastPage ? finish : () => setPage(page + 1)}
        >
          <Text style={styles.nextBtnText}>{isLastPage ? "Let's Go!" : 'Next'}</Text>
          <Ionicons name={isLastPage ? 'paw' : 'arrow-forward'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function GoalInput({ label, value, onChange, color, unit }: {
  label: string; value: string; onChange: (v: string) => void; color: string; unit: string;
}) {
  return (
    <View style={styles.goalInput}>
      <Text style={[styles.goalLabel, { color }]}>{label}</Text>
      <View style={styles.goalInputRow}>
        <TextInput
          style={styles.goalField}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
        />
        <Text style={styles.goalUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 28 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 80, marginBottom: Spacing.lg },
  chesterOnboard: {
    width: 160, height: 160, borderRadius: 80,
    overflow: 'hidden', borderWidth: 4, borderColor: Colors.primary,
    backgroundColor: '#FFF8F0', marginBottom: Spacing.lg,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  chesterOnboardImage: { width: '100%', height: '100%' },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md, lineHeight: 24, paddingHorizontal: Spacing.md },
  form: { width: '100%', marginTop: Spacing.xl },
  inputRow: { marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, color: Colors.text },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  goalInput: { width: (width - Spacing.lg * 2 - Spacing.sm) / 2, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  goalLabel: { fontSize: FontSize.xs, fontWeight: '600', marginBottom: Spacing.xs },
  goalInputRow: { flexDirection: 'row', alignItems: 'center' },
  goalField: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  goalUnit: { fontSize: FontSize.sm, color: Colors.textSecondary },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.md },
  backBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
  nextBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },

  // Water page styles
  activityGrid: { gap: Spacing.sm, marginBottom: Spacing.md },
  activityBtn: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 2, borderColor: Colors.border,
  },
  activityBtnActive: {
    borderColor: Colors.primary, backgroundColor: Colors.primary,
  },
  activityLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  activityLabelActive: { color: '#fff' },
  activityDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  waterResult: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center',
    borderWidth: 2, borderColor: '#4FC3F7',
  },
  waterIcon: { fontSize: 40 },
  waterGoalText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  waterGoalNumber: { fontSize: FontSize.xxl, fontWeight: '800', color: '#4FC3F7', marginTop: 4 },
  waterGoalSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
});
