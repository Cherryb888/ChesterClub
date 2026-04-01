import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { completeOnboarding, saveProfile, getProfile } from '../../services/storage';
import { Gender, FitnessGoal, DietType, CookingLevel } from '../../types';
import { ACTIVITY_LEVELS } from './onboardingData';
import { styles } from './onboardingStyles';
import WelcomeStep     from './steps/WelcomeStep';
import AboutYouStep    from './steps/AboutYouStep';
import BodyStatsStep   from './steps/BodyStatsStep';
import GoalActivityStep from './steps/GoalActivityStep';
import DietTypeStep    from './steps/DietTypeStep';
import AllergiesStep   from './steps/AllergiesStep';
import CookingStep     from './steps/CookingStep';
import ReviewStep      from './steps/ReviewStep';

const TOTAL_STEPS = 8;

// ─── BMR & Macro Calculators ───

function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') return base + 5;
  if (gender === 'female') return base - 161;
  return base - 78;
}

function calculateMacros(calories: number, goal: FitnessGoal, dietType: DietType) {
  let proteinRatio = 0.30, carbRatio = 0.40, fatRatio = 0.30;
  if (goal === 'gain_muscle') { proteinRatio = 0.35; carbRatio = 0.40; fatRatio = 0.25; }
  if (goal === 'lose_weight') { proteinRatio = 0.35; carbRatio = 0.35; fatRatio = 0.30; }
  if (dietType === 'keto')    { proteinRatio = 0.25; carbRatio = 0.05; fatRatio = 0.70; }
  if (dietType === 'paleo')   { proteinRatio = 0.30; carbRatio = 0.30; fatRatio = 0.40; }
  return {
    protein: Math.round((calories * proteinRatio) / 4),
    carbs:   Math.round((calories * carbRatio)    / 4),
    fat:     Math.round((calories * fatRatio)     / 9),
  };
}

function calculateWaterGlasses(weightKg: number, activityFactor: number): number {
  return Math.round((weightKg * 33 * (activityFactor / 1.2)) / 250);
}

// ─── Orchestrator ───

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [age, setAge] = useState('25');
  const [heightCm, setHeightCm] = useState('170');
  const [currentWeight, setCurrentWeight] = useState('70');
  const [targetWeight, setTargetWeight] = useState('70');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('maintain');
  const [activityLevel, setActivityLevel] = useState(1);
  const [dietType, setDietType] = useState<DietType>('no_restriction');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState('');
  const [cookingLevel, setCookingLevel] = useState<CookingLevel>('intermediate');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [maxPrepTime, setMaxPrepTime] = useState(30);
  const [cuisines, setCuisines] = useState<string[]>([]);

  const toggleAllergy  = (id: string) => setAllergies(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  const toggleCuisine  = (id: string) => setCuisines(prev => prev.includes(id)  ? prev.filter(c => c !== id) : [...prev, id]);

  // Computed plan values (used by step 7 ReviewStep)
  const bmr          = calculateBMR(gender, parseInt(currentWeight) || 70, parseInt(heightCm) || 170, parseInt(age) || 25);
  const tdee         = Math.round(bmr * ACTIVITY_LEVELS[activityLevel].factor);
  const goalCalories = fitnessGoal === 'lose_weight' ? tdee - 400 : fitnessGoal === 'gain_muscle' ? tdee + 300 : tdee;
  const macros       = calculateMacros(goalCalories, fitnessGoal, dietType);
  const waterGoal    = calculateWaterGlasses(parseInt(currentWeight) || 70, ACTIVITY_LEVELS[activityLevel].factor);

  const finish = async () => {
    const profile = await getProfile();
    profile.displayName = name || 'Friend';
    profile.goals = { dailyCalories: goalCalories, dailyProtein: macros.protein, dailyCarbs: macros.carbs, dailyFat: macros.fat, dailyWaterGlasses: waterGoal };
    profile.dietProfile = {
      gender, age: parseInt(age) || 25, heightCm: parseInt(heightCm) || 170,
      currentWeightKg: parseInt(currentWeight) || 70, targetWeightKg: parseInt(targetWeight) || 70,
      fitnessGoal, dietType, allergies,
      dislikedFoods: dislikedFoods.split(',').map(s => s.trim()).filter(Boolean),
      cookingLevel, mealsPerDay: mealsPerDay as 3 | 4 | 5 | 6,
      maxPrepTimeMinutes: maxPrepTime, cuisinePreferences: cuisines,
    };
    profile.onboardingComplete = true;
    await saveProfile(profile);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <WelcomeStep />;
      case 1: return <AboutYouStep name={name} setName={setName} gender={gender} setGender={setGender} />;
      case 2: return <BodyStatsStep age={age} setAge={setAge} heightCm={heightCm} setHeightCm={setHeightCm} currentWeight={currentWeight} setCurrentWeight={setCurrentWeight} targetWeight={targetWeight} setTargetWeight={setTargetWeight} />;
      case 3: return <GoalActivityStep fitnessGoal={fitnessGoal} setFitnessGoal={setFitnessGoal} activityLevel={activityLevel} setActivityLevel={setActivityLevel} />;
      case 4: return <DietTypeStep dietType={dietType} setDietType={setDietType} />;
      case 5: return <AllergiesStep allergies={allergies} toggleAllergy={toggleAllergy} dislikedFoods={dislikedFoods} setDislikedFoods={setDislikedFoods} />;
      case 6: return <CookingStep cookingLevel={cookingLevel} setCookingLevel={setCookingLevel} mealsPerDay={mealsPerDay} setMealsPerDay={setMealsPerDay} maxPrepTime={maxPrepTime} setMaxPrepTime={setMaxPrepTime} cuisines={cuisines} toggleCuisine={toggleCuisine} />;
      case 7: return <ReviewStep goalCalories={goalCalories} tdee={tdee} fitnessGoal={fitnessGoal} macros={macros} waterGoal={waterGoal} dietType={dietType} cookingLevel={cookingLevel} mealsPerDay={mealsPerDay} maxPrepTime={maxPrepTime} allergies={allergies} cuisines={cuisines} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar} accessibilityRole="progressbar" accessibilityLabel={`Onboarding progress: step ${step + 1} of ${TOTAL_STEPS}`} accessibilityValue={{ min: 0, max: TOTAL_STEPS, now: step + 1 }}>
        <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>
      <Text style={styles.stepCounter} accessibilityRole="header" accessibilityLabel={`Step ${step + 1} of ${TOTAL_STEPS}`}>{step + 1} of {TOTAL_STEPS}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)} accessibilityRole="button" accessibilityLabel="Go back to previous step">
            <Ionicons name="arrow-back" size={20} color="#999" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <TouchableOpacity style={styles.nextBtn} onPress={step === TOTAL_STEPS - 1 ? finish : () => setStep(step + 1)} accessibilityRole="button" accessibilityLabel={step === TOTAL_STEPS - 1 ? "Finish onboarding and start using the app" : "Continue to next step"}>
          <Text style={styles.nextBtnText}>{step === TOTAL_STEPS - 1 ? "Let's Go!" : 'Next'}</Text>
          <Ionicons name={step === TOTAL_STEPS - 1 ? 'paw' : 'arrow-forward'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
