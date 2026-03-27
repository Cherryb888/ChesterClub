import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { MealPlan, MealPlanDay, PlannedMeal, FoodItem } from '../../types';
import { getProfile, saveMealPlan, getMealPlan, addFoodToLog, addRecentFood, feedChester } from '../../services/storage';
import { generateMealPlan } from '../../services/gemini';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export default function MealPlanScreen() {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadExistingPlan();
  }, []);

  const loadExistingPlan = async () => {
    const profile = await getProfile();
    setIsPremium(profile.isPremiumMax);
    const plan = await getMealPlan();
    if (plan) setMealPlan(plan);
    setInitialLoad(false);
  };

  const generateNewPlan = async () => {
    setLoading(true);
    try {
      const profile = await getProfile();
      // Premium users get fully personalised plans using their diet profile
      const dietProfile = profile.isPremiumMax ? profile.dietProfile : undefined;
      const result = await generateMealPlan(profile.goals, dietProfile);
      const plan: MealPlan = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        days: result,
      };
      await saveMealPlan(plan);
      setMealPlan(plan);
      setExpandedDay(0);
    } catch (error: any) {
      Alert.alert('Oops!', 'Chester couldn\'t plan your meals right now. Try again in a moment!\n\n' + error.message);
    }
    setLoading(false);
  };

  const logMealToday = async (meal: PlannedMeal, mealType: typeof MEAL_TYPES[number]) => {
    const foodItem: FoodItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      servingSize: meal.servingSize,
      timestamp: Date.now(),
      mealType,
      source: 'meal_plan',
    };
    await addFoodToLog(foodItem);
    await addRecentFood(foodItem);
    const score = meal.calories < 600 && meal.protein > 15 ? 'great' : 'good';
    await feedChester(score);
    Alert.alert('Logged!', `${meal.name} added to today's log. Chester says thanks! 🐶`);
  };

  if (initialLoad) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Meal Planner</Text>
        <Text style={styles.subtitle}>AI-powered weekly meal suggestions</Text>

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && { opacity: 0.7 }]}
          onPress={generateNewPlan}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.generateText}>Chester is planning your meals...</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Text style={{ fontSize: 24 }}>🐶</Text>
              <Text style={styles.generateText}>
                {mealPlan ? 'Generate New Plan' : 'Plan My Week'}
              </Text>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Premium hint */}
        {!isPremium && (
          <View style={styles.premiumHint}>
            <Text style={{ fontSize: 16 }}>👑</Text>
            <Text style={styles.premiumHintText}>
              <Text style={{ fontWeight: '800', color: Colors.primary }}>Premium</Text> members get personalised plans based on diet, allergies, cuisines & cooking level
            </Text>
          </View>
        )}
        {isPremium && (
          <View style={[styles.premiumHint, { backgroundColor: '#FFD700' + '15', borderColor: '#FFD700' + '40' }]}>
            <Text style={{ fontSize: 16 }}>👑</Text>
            <Text style={[styles.premiumHintText, { color: '#B8860B' }]}>
              <Text style={{ fontWeight: '800' }}>Personalised plan active</Text> — meals match your diet profile
            </Text>
          </View>
        )}

        {!mealPlan && !loading && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 60 }}>🍽️</Text>
            <Text style={styles.emptyTitle}>No meal plan yet</Text>
            <Text style={styles.emptyText}>
              Tap "Plan My Week" and Chester will suggest 7 days of meals based on your nutrition goals!
            </Text>
          </View>
        )}

        {/* Meal plan display */}
        {mealPlan && !loading && (
          <>
            <Text style={styles.planDate}>
              Created {new Date(mealPlan.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>

            {mealPlan.days.map((day, dayIdx) => (
              <View key={dayIdx} style={styles.dayCard}>
                <TouchableOpacity
                  style={styles.dayHeader}
                  onPress={() => setExpandedDay(expandedDay === dayIdx ? -1 : dayIdx)}
                >
                  <View>
                    <Text style={styles.dayTitle}>
                      {getDayLabel(dayIdx)}
                    </Text>
                    <Text style={styles.dayMacros}>
                      {day.totalCalories} cal · {day.totalProtein}g P · {day.totalCarbs}g C · {day.totalFat}g F
                    </Text>
                  </View>
                  <Ionicons
                    name={expandedDay === dayIdx ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>

                {expandedDay === dayIdx && (
                  <View style={styles.mealsContainer}>
                    {MEAL_TYPES.map(mealType => {
                      const meal = day.meals[mealType];
                      if (!meal || !meal.name) return null;
                      return (
                        <View key={mealType} style={styles.mealItem}>
                          <View style={styles.mealHeader}>
                            <Text style={styles.mealTypeLabel}>
                              {MEAL_ICONS[mealType]} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                            </Text>
                            <TouchableOpacity
                              style={styles.logBtn}
                              onPress={() => logMealToday(meal, mealType)}
                            >
                              <Ionicons name="add-circle" size={20} color={Colors.primary} />
                              <Text style={styles.logBtnText}>Log</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.mealName}>{meal.name}</Text>
                          <Text style={styles.mealDesc}>{meal.description}</Text>
                          <View style={styles.mealMacros}>
                            <Text style={[styles.macroChip, { backgroundColor: Colors.calories + '20', color: Colors.calories }]}>
                              {meal.calories} cal
                            </Text>
                            <Text style={[styles.macroChip, { backgroundColor: Colors.protein + '20', color: Colors.protein }]}>
                              {meal.protein}g P
                            </Text>
                            <Text style={[styles.macroChip, { backgroundColor: Colors.carbs + '20', color: Colors.carbs }]}>
                              {meal.carbs}g C
                            </Text>
                            <Text style={[styles.macroChip, { backgroundColor: Colors.fat + '20', color: Colors.fat }]}>
                              {meal.fat}g F
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getDayLabel(idx: number): string {
  const d = new Date();
  d.setDate(d.getDate() + idx);
  if (idx === 0) return `Today - ${d.toLocaleDateString('en-US', { weekday: 'long' })}`;
  if (idx === 1) return `Tomorrow - ${d.toLocaleDateString('en-US', { weekday: 'long' })}`;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.md },
  generateBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  premiumHint: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary + '08', borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginTop: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary + '20',
  },
  premiumHintText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  generateText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  planDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  dayCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md,
  },
  dayTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  dayMacros: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  mealsContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  mealItem: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTypeLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  mealName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginTop: 4 },
  mealDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 20 },
  mealMacros: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, flexWrap: 'wrap' },
  macroChip: {
    fontSize: FontSize.xs, fontWeight: '600',
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.sm, overflow: 'hidden',
  },
});
