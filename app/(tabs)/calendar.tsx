import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { DailyLog, UserGoals } from '../../types';
import { getMonthLogs, getProfile, getDailyLog } from '../../services/storage';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthLogs, setMonthLogs] = useState<Record<string, DailyLog>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadMonth = useCallback(async () => {
    setLoading(true);
    const [logs, profile] = await Promise.all([
      getMonthLogs(year, month),
      getProfile(),
    ]);
    setMonthLogs(logs);
    setGoals(profile.goals);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setSelectedLog(null);
  };

  const goToNextMonth = () => {
    const now = new Date();
    // Don't allow going past current month
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
      setCurrentDate(new Date(year, month + 1, 1));
      setSelectedDate(null);
      setSelectedLog(null);
    }
  };

  const selectDay = async (date: string) => {
    setSelectedDate(date);
    const log = await getDailyLog(date);
    setSelectedLog(log);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getDayColor = (day: number): string => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = monthLogs[dateStr];
    if (!log || !goals) return Colors.border;
    const ratio = log.totalCalories / goals.dailyCalories;
    if (ratio >= 0.8 && ratio <= 1.1) return Colors.success;
    if (ratio >= 0.6 && ratio <= 1.3) return Colors.warning;
    return Colors.error;
  };

  const hasData = (day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return !!monthLogs[dateStr];
  };

  const canGoNext = () => {
    const now = new Date();
    return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Food Calendar</Text>
        <Text style={styles.subtitle}>Tap any day to see what you ate</Text>

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={[styles.navBtn, !canGoNext() && { opacity: 0.3 }]} disabled={!canGoNext()}>
            <Ionicons name="chevron-forward" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>On track</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.legendText}>Close</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
            <Text style={styles.legendText}>Off target</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
            <Text style={styles.legendText}>No data</Text>
          </View>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={styles.weekdayText}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const hasLog = hasData(day);
              const dayColor = getDayColor(day);

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    isSelected && styles.selectedCell,
                  ]}
                  onPress={() => selectDay(dateStr)}
                >
                  <Text style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                  ]}>{day}</Text>
                  {hasLog && (
                    <View style={[styles.dayDot, { backgroundColor: dayColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected day details */}
        {selectedDate && selectedLog && (
          <View style={styles.detailCard}>
            <Text style={styles.detailDate}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>

            {selectedLog.items.length === 0 ? (
              <Text style={styles.noData}>No meals logged this day</Text>
            ) : (
              <>
                {/* Daily totals */}
                <View style={styles.totalsRow}>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: Colors.calories }]}>{Math.round(selectedLog.totalCalories)}</Text>
                    <Text style={styles.totalLabel}>Cal</Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: Colors.protein }]}>{Math.round(selectedLog.totalProtein)}g</Text>
                    <Text style={styles.totalLabel}>Protein</Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: Colors.carbs }]}>{Math.round(selectedLog.totalCarbs)}g</Text>
                    <Text style={styles.totalLabel}>Carbs</Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: Colors.fat }]}>{Math.round(selectedLog.totalFat)}g</Text>
                    <Text style={styles.totalLabel}>Fat</Text>
                  </View>
                </View>

                {/* Food items */}
                {selectedLog.items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.foodItem}>
                    <View style={styles.foodRow}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      <Text style={styles.foodCal}>{item.calories} cal</Text>
                    </View>
                    <Text style={styles.foodMeta}>
                      {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)} · {item.servingSize}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.md },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  navBtn: { padding: Spacing.sm },
  monthLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  weekdayRow: {
    flexDirection: 'row', marginBottom: Spacing.xs,
  },
  weekdayText: {
    flex: 1, textAlign: 'center', fontSize: FontSize.xs,
    fontWeight: '600', color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  todayCell: {
    backgroundColor: Colors.primaryLight + '30',
    borderRadius: BorderRadius.md,
  },
  selectedCell: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  dayText: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  todayText: { fontWeight: '700', color: Colors.primary },
  selectedText: { color: '#fff', fontWeight: '700' },
  dayDot: {
    width: 6, height: 6, borderRadius: 3,
    position: 'absolute', bottom: 4,
  },
  detailCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginTop: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  detailDate: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  noData: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.lg },
  totalsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  totalItem: { alignItems: 'center' },
  totalValue: { fontSize: FontSize.lg, fontWeight: '700' },
  totalLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  foodItem: {
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border + '60',
  },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, flex: 1 },
  foodCal: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.calories },
  foodMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
