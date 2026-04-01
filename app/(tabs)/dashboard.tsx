import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getWeekLogs, getProfile, getChesterLifeStage, LIFE_STAGE_INFO } from '../../services/storage';
import { DailyLog, ChesterState, UserGoals } from '../../types';

const CHESTER_IMAGE = require('../../assets/chester/chester-happy.png');

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DashboardScreen() {
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([]);
  const [chester, setChester] = useState<ChesterState>({ level: 1, xp: 0, mood: 'happy', streak: 0, lastFedDate: null, outfit: 'default', health: 70, achievements: [], coins: 0, previousStreak: 0, streakShieldActive: false });
  const [goals, setGoals] = useState<UserGoals>({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65, dailyWaterGlasses: 8 });

  useFocusEffect(useCallback(() => {
    (async () => {
      const logs = await getWeekLogs();
      const profile = await getProfile();
      setWeekLogs(logs);
      setChester(profile.chester);
      setGoals(profile.goals);
    })();
  }, []));

  const avgCalories = weekLogs.length > 0
    ? Math.round(weekLogs.reduce((s, l) => s + l.totalCalories, 0) / weekLogs.filter(l => l.items.length > 0).length || 0)
    : 0;
  const avgProtein = weekLogs.length > 0
    ? Math.round(weekLogs.reduce((s, l) => s + l.totalProtein, 0) / weekLogs.filter(l => l.items.length > 0).length || 0)
    : 0;
  const totalMeals = weekLogs.reduce((s, l) => s + l.items.length, 0);
  const maxCalories = Math.max(...weekLogs.map(l => l.totalCalories), goals.dailyCalories);

  const stage = getChesterLifeStage(chester.level);
  const stageInfo = LIFE_STAGE_INFO[stage];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header} accessibilityRole="header">Dashboard</Text>
        <Text style={styles.subtitle}>Your weekly overview</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard} accessibilityLabel={`Day streak: ${chester.streak}`}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{chester.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard} accessibilityLabel={`Meals logged: ${totalMeals}`}>
            <Text style={styles.statEmoji}>🍽</Text>
            <Text style={styles.statValue}>{totalMeals}</Text>
            <Text style={styles.statLabel}>Meals Logged</Text>
          </View>
          <View style={styles.statCard} accessibilityLabel={`Average calories: ${avgCalories}`}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>{avgCalories}</Text>
            <Text style={styles.statLabel}>Avg Calories</Text>
          </View>
        </View>

        {/* Calorie Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Calories This Week</Text>
          <View style={styles.chartContainer}>
            {weekLogs.map((log, i) => {
              const d = new Date(Date.now() - (6 - i) * 86400000);
              const dayName = DAY_NAMES[d.getDay()];
              const height = maxCalories > 0 ? (log.totalCalories / maxCalories) * 120 : 0;
              const isToday = i === 6;
              const overGoal = log.totalCalories > goals.dailyCalories;
              return (
                <View key={i} style={styles.barContainer}>
                  <Text style={styles.barValue}>{log.totalCalories > 0 ? log.totalCalories : ''}</Text>
                  <View style={styles.barTrack}>
                    {/* Goal line */}
                    <View style={[styles.goalLine, { bottom: (goals.dailyCalories / maxCalories) * 120 }]} />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(height, 4),
                          backgroundColor: overGoal ? Colors.error : isToday ? Colors.primary : Colors.primaryLight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{dayName}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Under goal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.legendText}>Over goal</Text>
            </View>
          </View>
        </View>

        {/* Macro Averages */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Average Macros</Text>
          <View style={styles.macroAvgRow}>
            <MacroAvg label="Protein" value={avgProtein} goal={goals.dailyProtein} color={Colors.protein} />
            <MacroAvg
              label="Carbs"
              value={weekLogs.length > 0 ? Math.round(weekLogs.reduce((s, l) => s + l.totalCarbs, 0) / weekLogs.filter(l => l.items.length > 0).length || 0) : 0}
              goal={goals.dailyCarbs}
              color={Colors.carbs}
            />
            <MacroAvg
              label="Fat"
              value={weekLogs.length > 0 ? Math.round(weekLogs.reduce((s, l) => s + l.totalFat, 0) / weekLogs.filter(l => l.items.length > 0).length || 0) : 0}
              goal={goals.dailyFat}
              color={Colors.fat}
            />
          </View>
        </View>

        {/* Chester Status */}
        <View style={styles.chesterCard}>
          <Text style={styles.chartTitle}>Chester's Status</Text>
          <View style={styles.chesterRow}>
            <View style={styles.chesterImageContainer}>
              <Image
                source={CHESTER_IMAGE}
                style={styles.chesterImage}
                resizeMode="cover"
                accessibilityLabel="Chester the dog"
              />
            </View>
            <View style={styles.chesterInfo}>
              <Text style={styles.chesterLevel}>Level {chester.level}</Text>
              <Text style={[styles.chesterStage, { color: stageInfo.color }]}>{stageInfo.name}</Text>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${Math.min((chester.xp / (chester.level * 100)) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.chesterXp}>{chester.xp} / {chester.level * 100} XP</Text>
              <View style={styles.chesterMetaRow}>
                <Text style={styles.chesterMeta}>❤️ {chester.health}</Text>
                <Text style={styles.chesterMeta}>🪙 {chester.coins}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroAvg({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={styles.macroAvgItem} accessibilityLabel={`${label}: ${value}g of ${goal}g goal, ${Math.round(pct * 100)} percent`}>
      <View style={[styles.macroRing, { borderColor: color + '30' }]}>
        <Text style={[styles.macroRingValue, { color }]}>{Math.round(pct * 100)}%</Text>
      </View>
      <Text style={styles.macroAvgValue}>{value}g</Text>
      <Text style={styles.macroAvgLabel}>{label}</Text>
      <Text style={styles.macroAvgGoal}>Goal: {goal}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  header: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginTop: 4 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  chartTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 20 },
  barContainer: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 10, color: Colors.textSecondary, marginBottom: 4 },
  barTrack: { width: 24, height: 120, justifyContent: 'flex-end', position: 'relative' },
  bar: { width: '100%', borderRadius: 6 },
  goalLine: { position: 'absolute', left: -4, right: -4, height: 1.5, backgroundColor: Colors.textLight, borderStyle: 'dashed' },
  barLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 6 },
  barLabelToday: { color: Colors.primary, fontWeight: '700' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginTop: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  macroAvgRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroAvgItem: { alignItems: 'center' },
  macroRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  macroRingValue: { fontSize: FontSize.md, fontWeight: '700' },
  macroAvgValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginTop: Spacing.xs },
  macroAvgLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  macroAvgGoal: { fontSize: 10, color: Colors.textLight },
  chesterCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  chesterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chesterImageContainer: {
    width: 64, height: 64, borderRadius: 32,
    overflow: 'hidden', borderWidth: 2, borderColor: Colors.primary,
    backgroundColor: '#FFF8F0',
  },
  chesterImage: { width: '100%', height: '100%' },
  chesterInfo: { flex: 1 },
  chesterLevel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  chesterStage: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },
  xpBar: { height: 12, backgroundColor: Colors.border, borderRadius: BorderRadius.full, overflow: 'hidden', marginVertical: Spacing.xs },
  xpFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  chesterXp: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chesterMetaRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  chesterMeta: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
});
