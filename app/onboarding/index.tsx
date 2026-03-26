import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { completeOnboarding, saveProfile, getProfile } from '../../services/storage';
import { DietType, FitnessGoal, Gender, CookingLevel, DietProfile } from '../../types';

const { width } = Dimensions.get('window');

const TOTAL_STEPS = 8;

// ─── Option Data ───

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: '♂️' },
  { value: 'female', label: 'Female', icon: '♀️' },
  { value: 'other', label: 'Other', icon: '⚧️' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🙂' },
];

const GOAL_OPTIONS: { value: FitnessGoal; label: string; icon: string; description: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '⬇️', description: 'Reduce body fat while staying healthy' },
  { value: 'maintain', label: 'Maintain', icon: '⚖️', description: 'Keep current weight, eat balanced' },
  { value: 'gain_muscle', label: 'Build Muscle', icon: '💪', description: 'Gain lean mass with higher protein' },
  { value: 'improve_health', label: 'Eat Healthier', icon: '🥗', description: 'Focus on nutrition quality' },
];

const DIET_OPTIONS: { value: DietType; label: string; icon: string }[] = [
  { value: 'no_restriction', label: 'No Restrictions', icon: '🍽️' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { value: 'keto', label: 'Keto', icon: '🥑' },
  { value: 'paleo', label: 'Paleo', icon: '🥩' },
  { value: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'kosher', label: 'Kosher', icon: '✡️' },
];

const ALLERGY_OPTIONS = [
  { id: 'nuts', label: 'Nuts', icon: '🥜' },
  { id: 'dairy', label: 'Dairy', icon: '🥛' },
  { id: 'gluten', label: 'Gluten', icon: '🌾' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'soy', label: 'Soy', icon: '🫘' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'sesame', label: 'Sesame', icon: '🫘' },
];

const CUISINE_OPTIONS = [
  { id: 'italian', label: 'Italian', icon: '🍝' },
  { id: 'asian', label: 'Asian', icon: '🍜' },
  { id: 'mexican', label: 'Mexican', icon: '🌮' },
  { id: 'indian', label: 'Indian', icon: '🍛' },
  { id: 'american', label: 'American', icon: '🍔' },
  { id: 'japanese', label: 'Japanese', icon: '🍣' },
  { id: 'mediterranean', label: 'Mediterranean', icon: '🥙' },
  { id: 'korean', label: 'Korean', icon: '🥘' },
  { id: 'thai', label: 'Thai', icon: '🍲' },
  { id: 'middle_eastern', label: 'Middle Eastern', icon: '🧆' },
];

const COOKING_OPTIONS: { value: CookingLevel; label: string; description: string; icon: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Simple recipes, minimal prep', icon: '🔰' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable in the kitchen', icon: '👨‍🍳' },
  { value: 'advanced', label: 'Advanced', description: 'Love complex recipes', icon: '⭐' },
];

const ACTIVITY_LEVELS = [
  { label: 'Sedentary', description: 'Desk job, little exercise', factor: 1.2 },
  { label: 'Lightly Active', description: 'Light exercise 1-3 days/week', factor: 1.375 },
  { label: 'Moderately Active', description: 'Exercise 3-5 days/week', factor: 1.55 },
  { label: 'Very Active', description: 'Hard exercise 6-7 days/week', factor: 1.725 },
];

// ─── BMR & Macro Calculator ───

function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  // Mifflin-St Jeor equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') return base + 5;
  if (gender === 'female') return base - 161;
  return base - 78; // average for other/prefer_not_to_say
}

function calculateMacros(calories: number, goal: FitnessGoal, dietType: DietType): { protein: number; carbs: number; fat: number } {
  let proteinRatio = 0.30;
  let carbRatio = 0.40;
  let fatRatio = 0.30;

  if (goal === 'gain_muscle') { proteinRatio = 0.35; carbRatio = 0.40; fatRatio = 0.25; }
  if (goal === 'lose_weight') { proteinRatio = 0.35; carbRatio = 0.35; fatRatio = 0.30; }

  if (dietType === 'keto') { proteinRatio = 0.25; carbRatio = 0.05; fatRatio = 0.70; }
  if (dietType === 'paleo') { proteinRatio = 0.30; carbRatio = 0.30; fatRatio = 0.40; }

  return {
    protein: Math.round((calories * proteinRatio) / 4), // 4 cal per gram
    carbs: Math.round((calories * carbRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9), // 9 cal per gram
  };
}

function calculateWaterGlasses(weightKg: number, activityFactor: number): number {
  const baseml = weightKg * 33 * (activityFactor / 1.2); // normalize from sedentary
  return Math.round(baseml / 250);
}

// ─── Component ───

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 0: Welcome
  // Step 1: Name + Gender
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  // Step 2: Body stats
  const [age, setAge] = useState('25');
  const [heightCm, setHeightCm] = useState('170');
  const [currentWeight, setCurrentWeight] = useState('70');
  const [targetWeight, setTargetWeight] = useState('70');
  // Step 3: Goal + Activity
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('maintain');
  const [activityLevel, setActivityLevel] = useState(1);
  // Step 4: Diet type
  const [dietType, setDietType] = useState<DietType>('no_restriction');
  // Step 5: Allergies + Dislikes
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState('');
  // Step 6: Cooking & Cuisine
  const [cookingLevel, setCookingLevel] = useState<CookingLevel>('intermediate');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [maxPrepTime, setMaxPrepTime] = useState(30);
  const [cuisines, setCuisines] = useState<string[]>([]);
  // Step 7: Review + Go

  // Calculated values
  const bmr = calculateBMR(gender, parseInt(currentWeight) || 70, parseInt(heightCm) || 170, parseInt(age) || 25);
  const tdee = Math.round(bmr * ACTIVITY_LEVELS[activityLevel].factor);
  const goalCalories = fitnessGoal === 'lose_weight' ? tdee - 400
    : fitnessGoal === 'gain_muscle' ? tdee + 300
    : tdee;
  const macros = calculateMacros(goalCalories, fitnessGoal, dietType);
  const waterGoal = calculateWaterGlasses(parseInt(currentWeight) || 70, ACTIVITY_LEVELS[activityLevel].factor);

  const toggleAllergy = (id: string) => {
    setAllergies(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const toggleCuisine = (id: string) => {
    setCuisines(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const finish = async () => {
    const profile = await getProfile();
    profile.displayName = name || 'Friend';
    profile.goals = {
      dailyCalories: goalCalories,
      dailyProtein: macros.protein,
      dailyCarbs: macros.carbs,
      dailyFat: macros.fat,
      dailyWaterGlasses: waterGoal,
    };
    profile.dietProfile = {
      gender,
      age: parseInt(age) || 25,
      heightCm: parseInt(heightCm) || 170,
      currentWeightKg: parseInt(currentWeight) || 70,
      targetWeightKg: parseInt(targetWeight) || 70,
      fitnessGoal,
      dietType,
      allergies,
      dislikedFoods: dislikedFoods.split(',').map(s => s.trim()).filter(Boolean),
      cookingLevel,
      mealsPerDay: mealsPerDay as 3 | 4 | 5 | 6,
      maxPrepTimeMinutes: maxPrepTime,
      cuisinePreferences: cuisines,
    };
    profile.onboardingComplete = true;
    await saveProfile(profile);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const renderStep = () => {
    switch (step) {
      // ─── Welcome ───
      case 0:
        return (
          <View style={styles.center}>
            <View style={styles.chesterOnboard}>
              <Image source={require('../../assets/chester/chester-happy.png')} style={styles.chesterImage} resizeMode="cover" />
            </View>
            <Text style={styles.title}>Meet Chester!</Text>
            <Text style={styles.subtitle}>
              Your golden retriever food tracking buddy. Let's set up your personalised nutrition plan!
            </Text>
          </View>
        );

      // ─── Name + Gender ───
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.title}>About You</Text>
            <Text style={styles.subtitle}>What should Chester call you?</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={Colors.textLight}
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

      // ─── Body Stats ───
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>📏</Text>
            <Text style={styles.title}>Body Stats</Text>
            <Text style={styles.subtitle}>Used to calculate your daily energy needs</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="25" placeholderTextColor={Colors.textLight} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Height (cm)</Text>
                <TextInput style={styles.input} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder="170" placeholderTextColor={Colors.textLight} />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Current Weight (kg)</Text>
                <TextInput style={styles.input} value={currentWeight} onChangeText={(v) => { setCurrentWeight(v); if (!targetWeight || targetWeight === currentWeight) setTargetWeight(v); }} keyboardType="numeric" placeholder="70" placeholderTextColor={Colors.textLight} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Target Weight (kg)</Text>
                <TextInput style={styles.input} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" placeholder="70" placeholderTextColor={Colors.textLight} />
              </View>
            </View>
          </View>
        );

      // ─── Goal + Activity ───
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.title}>Your Goal</Text>
            {GOAL_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.cardOption, fitnessGoal === opt.value && styles.cardOptionActive]}
                onPress={() => setFitnessGoal(opt.value)}
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
              >
                <View style={styles.cardOptionText}>
                  <Text style={[styles.cardOptionTitle, activityLevel === idx && styles.cardOptionTitleActive]}>{level.label}</Text>
                  <Text style={[styles.cardOptionDesc, activityLevel === idx && { color: '#ffffffCC' }]}>{level.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      // ─── Diet Type ───
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>🥗</Text>
            <Text style={styles.title}>Diet Type</Text>
            <Text style={styles.subtitle}>Chester will plan meals that fit your lifestyle</Text>
            <View style={styles.chipGrid}>
              {DIET_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, dietType === opt.value && styles.chipActive]}
                  onPress={() => setDietType(opt.value)}
                >
                  <Text style={styles.chipIcon}>{opt.icon}</Text>
                  <Text style={[styles.chipLabel, dietType === opt.value && styles.chipLabelActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // ─── Allergies + Dislikes ───
      case 5:
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

      // ─── Cooking & Cuisine ───
      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>👨‍🍳</Text>
            <Text style={styles.title}>Cooking & Preferences</Text>

            <Text style={styles.sectionLabel}>Cooking Skill</Text>
            {COOKING_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.cardOption, cookingLevel === opt.value && styles.cardOptionActive]}
                onPress={() => setCookingLevel(opt.value)}
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
                <TouchableOpacity
                  key={n}
                  style={[styles.numberBtn, mealsPerDay === n && styles.numberBtnActive]}
                  onPress={() => setMealsPerDay(n)}
                >
                  <Text style={[styles.numberBtnText, mealsPerDay === n && styles.numberBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Max Prep Time Per Meal</Text>
            <View style={styles.numberRow}>
              {[15, 30, 45, 60].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.numberBtn, maxPrepTime === t && styles.numberBtnActive]}
                  onPress={() => setMaxPrepTime(t)}
                >
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
                >
                  <Text style={styles.chipIcon}>{opt.icon}</Text>
                  <Text style={[styles.chipLabel, cuisines.includes(opt.id) && styles.chipLabelActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // ─── Review ───
      case 7:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepEmoji}>✅</Text>
            <Text style={styles.title}>Your Plan</Text>
            <Text style={styles.subtitle}>Chester calculated your personalised targets</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Daily Calories</Text>
              <Text style={styles.reviewValue}>{goalCalories} cal</Text>
              <Text style={styles.reviewHint}>
                TDEE: {tdee} cal {fitnessGoal === 'lose_weight' ? '(-400 deficit)' : fitnessGoal === 'gain_muscle' ? '(+300 surplus)' : '(maintenance)'}
              </Text>
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
              <ReviewRow label="Goal" value={GOAL_OPTIONS.find(g => g.value === fitnessGoal)?.label || ''} />
              <ReviewRow label="Diet" value={DIET_OPTIONS.find(d => d.value === dietType)?.label || ''} />
              <ReviewRow label="Cooking" value={COOKING_OPTIONS.find(c => c.value === cookingLevel)?.label || ''} />
              <ReviewRow label="Meals/day" value={`${mealsPerDay}`} />
              <ReviewRow label="Max prep" value={`${maxPrepTime} min`} />
              {allergies.length > 0 && <ReviewRow label="Allergies" value={allergies.join(', ')} />}
              {cuisines.length > 0 && <ReviewRow label="Cuisines" value={cuisines.join(', ')} />}
            </View>

            <Text style={styles.reviewNote}>
              You can change any of these later in Settings. Premium users get personalised weekly meal plans based on this profile.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>
      <Text style={styles.stepCounter}>{step + 1} of {TOTAL_STEPS}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={step === TOTAL_STEPS - 1 ? finish : () => setStep(step + 1)}
        >
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS - 1 ? "Let's Go!" : 'Next'}
          </Text>
          <Ionicons name={step === TOTAL_STEPS - 1 ? 'paw' : 'arrow-forward'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewRowLabel}>{label}</Text>
      <Text style={styles.reviewRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stepContent: { flex: 1 },

  // Progress
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  stepCounter: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.md },

  // Chester
  chesterOnboard: {
    width: 160, height: 160, borderRadius: 80, overflow: 'hidden',
    borderWidth: 4, borderColor: Colors.primary, backgroundColor: '#FFF8F0',
    marginBottom: Spacing.lg, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  chesterImage: { width: '100%', height: '100%' },

  // Typography
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg, paddingHorizontal: Spacing.md },
  stepEmoji: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.md },
  sectionLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs, marginTop: Spacing.md },
  sectionHint: { fontSize: FontSize.xs, color: Colors.textLight, marginBottom: Spacing.sm },

  // Inputs
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, color: Colors.text,
    marginBottom: Spacing.sm,
  },
  fieldRow: { flexDirection: 'row', gap: Spacing.sm },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },

  // Option grid (gender)
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionBtn: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  optionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionIcon: { fontSize: 24, marginBottom: 4 },
  optionLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  optionLabelActive: { color: '#fff' },

  // Card options (goal, activity, cooking)
  cardOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 2, borderColor: Colors.border,
  },
  cardOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  cardOptionIcon: { fontSize: 28 },
  cardOptionText: { flex: 1 },
  cardOptionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  cardOptionTitleActive: { color: '#fff' },
  cardOptionDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  // Chip grid (diet, allergies, cuisines)
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    borderWidth: 2, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  chipActiveRed: { borderColor: Colors.error, backgroundColor: Colors.error },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  chipLabelActive: { color: '#fff' },

  // Number buttons (meals per day, prep time)
  numberRow: { flexDirection: 'row', gap: Spacing.sm },
  numberBtn: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.border,
  },
  numberBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  numberBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  numberBtnTextActive: { color: '#fff' },

  // Review
  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  reviewLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  reviewValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  reviewHint: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 4 },
  reviewMacros: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  reviewMacroBox: {
    flex: 1, alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  reviewMacroValue: { fontSize: FontSize.lg, fontWeight: '800' },
  reviewMacroLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  reviewSummary: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '40' },
  reviewRowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  reviewRowValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  reviewNote: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.md },

  // Navigation
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.md },
  backBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.full,
  },
  nextBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});
