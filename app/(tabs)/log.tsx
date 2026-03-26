import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getDailyLog, removeFoodFromLog, getTodayKey, getProfile } from '../../services/storage';
import { addFavorite, isFavorite, removeFavorite, getFavorites, FavoriteFood } from '../../services/favoritesService';
import { DailyLog, FoodItem, UserGoals } from '../../types';

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿',
};

export default function LogScreen() {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [goals, setGoals] = useState<UserGoals>({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65, dailyWaterGlasses: 8 });
  const [favoriteNames, setFavoriteNames] = useState<Set<string>>(new Set());
  const router = useRouter();

  const loadLog = useCallback(async () => {
    const todayLog = await getDailyLog(getTodayKey());
    const profile = await getProfile();
    setLog(todayLog);
    setGoals(profile.goals);
    const favs = await getFavorites();
    setFavoriteNames(new Set(favs.map(f => f.name.toLowerCase())));
  }, []);

  useFocusEffect(useCallback(() => { loadLog(); }, [loadLog]));

  const deleteItem = (item: FoodItem) => {
    Alert.alert('Remove Food', `Remove ${item.name} from today's log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await removeFoodFromLog(item.id);
          loadLog();
        }
      },
    ]);
  };

  const toggleFavorite = async (item: FoodItem) => {
    const isFav = favoriteNames.has(item.name.toLowerCase());
    if (isFav) {
      const favs = await getFavorites();
      const fav = favs.find(f => f.name.toLowerCase() === item.name.toLowerCase());
      if (fav) await removeFavorite(fav.id);
    } else {
      await addFavorite(item);
    }
    const favs = await getFavorites();
    setFavoriteNames(new Set(favs.map(f => f.name.toLowerCase())));
  };

  // Group by meal type
  const grouped = (log?.items || []).reduce((acc, item) => {
    if (!acc[item.mealType]) acc[item.mealType] = [];
    acc[item.mealType].push(item);
    return acc;
  }, {} as Record<string, FoodItem[]>);

  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Today's Food Log</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

        {/* Summary bar */}
        <View style={styles.summaryCard}>
          <SummaryStat label="Calories" value={log?.totalCalories || 0} goal={goals.dailyCalories} color={Colors.calories} />
          <View style={styles.divider} />
          <SummaryStat label="Protein" value={log?.totalProtein || 0} goal={goals.dailyProtein} color={Colors.protein} suffix="g" />
          <View style={styles.divider} />
          <SummaryStat label="Carbs" value={log?.totalCarbs || 0} goal={goals.dailyCarbs} color={Colors.carbs} suffix="g" />
          <View style={styles.divider} />
          <SummaryStat label="Fat" value={log?.totalFat || 0} goal={goals.dailyFat} color={Colors.fat} suffix="g" />
        </View>

        {/* Meal sections */}
        {log?.items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🐕</Text>
            <Text style={styles.emptyText}>No food logged yet today!</Text>
            <Text style={styles.emptySubtext}>Chester is waiting for you to scan your first meal</Text>
            <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/(tabs)/scanner')}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.scanBtnText}>Scan Food</Text>
            </TouchableOpacity>
          </View>
        )}

        {mealOrder.map(meal => {
          const items = grouped[meal];
          if (!items || items.length === 0) return null;
          const mealCals = items.reduce((s, i) => s + i.calories, 0);
          return (
            <View key={meal} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealIcon}>{MEAL_ICONS[meal]}</Text>
                <Text style={styles.mealTitle}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
                <Text style={styles.mealCals}>{mealCals} cal</Text>
              </View>
              {items.map(item => {
                const isFav = favoriteNames.has(item.name.toLowerCase());
                return (
                  <TouchableOpacity key={item.id} style={styles.foodItem} onLongPress={() => deleteItem(item)}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      <Text style={styles.foodServing}>{item.servingSize}</Text>
                    </View>
                    <View style={styles.foodMacros}>
                      <Text style={styles.foodCals}>{item.calories} cal</Text>
                      <Text style={styles.foodMacroDetail}>P:{item.protein}g  C:{item.carbs}g  F:{item.fat}g</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.favBtn}
                      onPress={() => toggleFavorite(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={22}
                        color={isFav ? Colors.error : Colors.textLight}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* FAB to add food */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(tabs)/scanner')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function SummaryStat({ label, value, goal, color, suffix }: { label: string; value: number; goal: number; color: string; suffix?: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{Math.round(value)}{suffix}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryGoal}>/{goal}{suffix}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  header: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  date: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: FontSize.md, fontWeight: '700' },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  summaryGoal: { fontSize: FontSize.xs, color: Colors.textLight },
  divider: { width: 1, backgroundColor: Colors.border },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 64 },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.lg },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  mealSection: { marginBottom: Spacing.lg },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  mealIcon: { fontSize: 20 },
  mealTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, flex: 1 },
  mealCals: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  foodInfo: { flex: 1 },
  foodName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  foodServing: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  foodMacros: { alignItems: 'flex-end' },
  foodCals: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  foodMacroDetail: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  favBtn: { paddingLeft: Spacing.sm, justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
});
