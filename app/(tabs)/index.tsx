import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import ChesterAvatar from '../../components/Chester/ChesterAvatar';
import ChesterReaction from '../../components/Chester/ChesterReaction';
import { getProfile, getDailyLog, getTodayKey } from '../../services/storage';
import { ChesterState, DailyLog, UserGoals } from '../../types';

const GREETINGS = [
  "Woof! Ready to track some yummy food?",
  "Let's have a paw-some day of eating!",
  "Chester's hungry for some data! Let's log!",
  "Bark bark! Time to fuel up!",
  "Who's a good tracker? You are!",
];

export default function HomeScreen() {
  const router = useRouter();
  const [chester, setChester] = useState<ChesterState>({ level: 1, xp: 0, mood: 'happy', streak: 0, lastFedDate: null, outfit: 'default' });
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [goals, setGoals] = useState<UserGoals>({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 });
  const [refreshing, setRefreshing] = useState(false);
  const [greeting] = useState(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  const loadData = useCallback(async () => {
    const profile = await getProfile();
    setChester(profile.chester);
    setGoals(profile.goals);
    const log = await getDailyLog(getTodayKey());
    setTodayLog(log);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calorieProgress = todayLog ? Math.min(todayLog.totalCalories / goals.dailyCalories, 1) : 0;
  const caloriesLeft = goals.dailyCalories - (todayLog?.totalCalories || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <Text style={styles.header}>ChesterClub</Text>

        {/* Chester */}
        <View style={styles.chesterSection}>
          <ChesterAvatar chester={chester} size="large" />
          <ChesterReaction message={greeting} visible={true} />
        </View>

        {/* Quick Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Progress</Text>
          <View style={styles.calorieRow}>
            <View style={styles.calorieCircle}>
              <Text style={styles.calorieNumber}>{todayLog?.totalCalories || 0}</Text>
              <Text style={styles.calorieLabel}>eaten</Text>
            </View>
            <View style={styles.calorieDivider} />
            <View style={styles.calorieCircle}>
              <Text style={[styles.calorieNumber, { color: caloriesLeft > 0 ? Colors.success : Colors.error }]}>
                {Math.abs(caloriesLeft)}
              </Text>
              <Text style={styles.calorieLabel}>{caloriesLeft > 0 ? 'remaining' : 'over'}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${calorieProgress * 100}%`, backgroundColor: calorieProgress > 1 ? Colors.error : Colors.primary }]} />
          </View>
          <Text style={styles.progressLabel}>{Math.round(calorieProgress * 100)}% of {goals.dailyCalories} cal goal</Text>

          {/* Macro summary */}
          <View style={styles.macroRow}>
            <MacroStat label="Protein" value={todayLog?.totalProtein || 0} goal={goals.dailyProtein} color={Colors.protein} unit="g" />
            <MacroStat label="Carbs" value={todayLog?.totalCarbs || 0} goal={goals.dailyCarbs} color={Colors.carbs} unit="g" />
            <MacroStat label="Fat" value={todayLog?.totalFat || 0} goal={goals.dailyFat} color={Colors.fat} unit="g" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/scanner')}>
            <Ionicons name="camera" size={28} color={Colors.surface} />
            <Text style={styles.actionText}>Scan Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.secondary }]} onPress={() => router.push('/(tabs)/log')}>
            <Ionicons name="add-circle" size={28} color={Colors.surface} />
            <Text style={styles.actionText}>Quick Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroStat({ label, value, goal, color, unit }: { label: string; value: number; goal: number; color: string; unit: string }) {
  const progress = Math.min(value / goal, 1);
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}{unit}</Text>
      <View style={styles.macroBar}>
        <View style={[styles.macroFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  header: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  chesterSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calorieCircle: { alignItems: 'center' },
  calorieNumber: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  calorieLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  calorieDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  macroBar: {
    width: '80%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginVertical: 4,
  },
  macroFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  macroLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
