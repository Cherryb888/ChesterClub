import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getWeightHistory, addWeightEntry, deleteWeightEntry, getSettings } from '../../services/storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = Spacing.lg * 2 + Spacing.lg * 2;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING;

export default function WeightScreen() {
  const [history, setHistory] = useState<{ date: string; weight: number }[]>([]);
  const [inputWeight, setInputWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [showInput, setShowInput] = useState(false);

  const loadData = useCallback(async () => {
    const data = await getWeightHistory();
    setHistory(data);
    const settings = await getSettings();
    setUnit(settings.weightUnit);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleAdd = async () => {
    const weight = parseFloat(inputWeight);
    if (isNaN(weight) || weight <= 0 || weight > 500) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }
    await addWeightEntry(weight, unit);
    setInputWeight('');
    setShowInput(false);
    await loadData();
  };

  const handleDelete = (date: string) => {
    Alert.alert('Delete Entry', `Remove weight entry for ${formatDate(date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteWeightEntry(date);
          await loadData();
        }
      },
    ]);
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateFull = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Stats
  const latestWeight = history.length > 0 ? history[history.length - 1].weight : null;
  const startWeight = history.length > 0 ? history[0].weight : null;
  const weightChange = latestWeight && startWeight ? latestWeight - startWeight : null;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weekHistory = history.filter(e => e.date >= weekAgo);
  const weekChange = weekHistory.length >= 2
    ? weekHistory[weekHistory.length - 1].weight - weekHistory[0].weight
    : null;

  // Chart data (last 30 entries)
  const chartData = history.slice(-30);
  const minWeight = chartData.length > 0 ? Math.min(...chartData.map(d => d.weight)) - 2 : 0;
  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) + 2 : 100;
  const weightRange = maxWeight - minWeight || 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Weight Tracker</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowInput(!showInput)}
          >
            <Ionicons name={showInput ? 'close' : 'add'} size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Weight Input */}
        {showInput && (
          <View style={styles.inputCard}>
            <Text style={styles.inputTitle}>Log Today's Weight</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.weightInput}
                value={inputWeight}
                onChangeText={setInputWeight}
                placeholder={unit === 'kg' ? '75.0' : '165.0'}
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.unitLabel}>{unit}</Text>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Current Stats */}
        {latestWeight !== null && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{latestWeight.toFixed(1)}</Text>
              <Text style={styles.statUnit}>{unit}</Text>
              <Text style={styles.statLabel}>Current</Text>
            </View>
            {weightChange !== null && (
              <View style={styles.statCard}>
                <Text style={[styles.statValue, {
                  color: weightChange < 0 ? Colors.success : weightChange > 0 ? Colors.error : Colors.textSecondary,
                }]}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                </Text>
                <Text style={styles.statUnit}>{unit}</Text>
                <Text style={styles.statLabel}>Total Change</Text>
              </View>
            )}
            {weekChange !== null && (
              <View style={styles.statCard}>
                <Text style={[styles.statValue, {
                  color: weekChange < 0 ? Colors.success : weekChange > 0 ? Colors.error : Colors.textSecondary,
                }]}>
                  {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)}
                </Text>
                <Text style={styles.statUnit}>{unit}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            )}
          </View>
        )}

        {/* Weight Chart */}
        {chartData.length >= 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weight Trend</Text>
            <View style={styles.chartContainer}>
              {/* Y-axis labels */}
              <View style={styles.yAxis}>
                <Text style={styles.yLabel}>{maxWeight.toFixed(0)}</Text>
                <Text style={styles.yLabel}>{((maxWeight + minWeight) / 2).toFixed(0)}</Text>
                <Text style={styles.yLabel}>{minWeight.toFixed(0)}</Text>
              </View>

              {/* Chart area */}
              <View style={styles.chartArea}>
                {/* Grid lines */}
                <View style={[styles.gridLine, { top: 0 }]} />
                <View style={[styles.gridLine, { top: '50%' }]} />
                <View style={[styles.gridLine, { bottom: 0 }]} />

                {/* Data points and lines */}
                {chartData.map((entry, i) => {
                  const x = chartData.length > 1
                    ? (i / (chartData.length - 1)) * 100
                    : 50;
                  const y = ((entry.weight - minWeight) / weightRange) * 100;

                  return (
                    <View key={entry.date} style={[styles.dataPoint, {
                      left: `${x}%`,
                      bottom: `${y}%`,
                    }]}>
                      <View style={styles.dot} />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* X-axis labels */}
            <View style={styles.xAxis}>
              <Text style={styles.xLabel}>{formatDate(chartData[0].date)}</Text>
              {chartData.length > 2 && (
                <Text style={styles.xLabel}>{formatDate(chartData[Math.floor(chartData.length / 2)].date)}</Text>
              )}
              <Text style={styles.xLabel}>{formatDate(chartData[chartData.length - 1].date)}</Text>
            </View>
          </View>
        )}

        {/* History List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>History</Text>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="scale-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No weight entries yet</Text>
              <Text style={styles.emptyHint}>
                Tap the + button to log your first weight entry
              </Text>
            </View>
          ) : (
            [...history].reverse().map((entry, i) => {
              const prevEntry = history.length > 1 && i < history.length - 1
                ? [...history].reverse()[i + 1]
                : null;
              const change = prevEntry ? entry.weight - prevEntry.weight : null;

              return (
                <TouchableOpacity
                  key={entry.date}
                  style={styles.historyRow}
                  onLongPress={() => handleDelete(entry.date)}
                >
                  <View style={styles.historyDate}>
                    <Text style={styles.historyDateText}>{formatDateFull(entry.date)}</Text>
                  </View>
                  <View style={styles.historyWeight}>
                    <Text style={styles.historyWeightText}>
                      {entry.weight.toFixed(1)} {unit}
                    </Text>
                    {change !== null && (
                      <Text style={[styles.historyChange, {
                        color: change < 0 ? Colors.success : change > 0 ? Colors.error : Colors.textSecondary,
                      }]}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          {history.length > 0 && (
            <Text style={styles.historyHint}>Long press an entry to delete it</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  header: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },

  // Input
  inputCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  inputTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  weightInput: {
    flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: FontSize.xl, fontWeight: '700',
    color: Colors.text, borderWidth: 2, borderColor: Colors.primary,
    textAlign: 'center',
  },
  unitLabel: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  statUnit: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },

  // Chart
  chartContainer: { flexDirection: 'row', height: 160, marginBottom: Spacing.sm },
  yAxis: { width: 36, justifyContent: 'space-between', paddingVertical: 4 },
  yLabel: { fontSize: 10, color: Colors.textLight, textAlign: 'right' },
  chartArea: { flex: 1, position: 'relative', marginLeft: Spacing.sm },
  gridLine: {
    position: 'absolute', left: 0, right: 0,
    height: 1, backgroundColor: Colors.border,
  },
  dataPoint: {
    position: 'absolute',
    marginLeft: -5, marginBottom: -5,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2, borderColor: '#fff',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 2,
  },
  xAxis: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginLeft: 44, marginTop: 4,
  },
  xLabel: { fontSize: 10, color: Colors.textLight },

  // History
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textLight, marginTop: Spacing.xs, textAlign: 'center' },

  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  historyDate: {},
  historyDateText: { fontSize: FontSize.sm, color: Colors.text },
  historyWeight: { alignItems: 'flex-end' },
  historyWeightText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  historyChange: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },
  historyHint: {
    fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center',
    marginTop: Spacing.md, fontStyle: 'italic',
  },
});
