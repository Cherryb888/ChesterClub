import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { generateWeeklyInsights, getDailyTip, NutritionInsight } from '../../services/insightsService';

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  celebration: { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  tip: { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' },
  alert: { bg: '#FFEBEE', border: '#F44336', text: '#C62828' },
  trend: { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0' },
};

export default function InsightsScreen() {
  const [insights, setInsights] = useState<NutritionInsight[]>([]);
  const [dailyTip, setDailyTip] = useState<NutritionInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadInsights = useCallback(async () => {
    setLoading(true);
    const [weekly, tip] = await Promise.all([
      generateWeeklyInsights(),
      getDailyTip(),
    ]);
    setInsights(weekly);
    setDailyTip(tip);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadInsights(); }, [loadInsights]));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.header}>Nutrition Insights</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Daily Tip */}
            {dailyTip && (
              <View style={styles.dailyTipCard}>
                <Text style={styles.dailyTipHeader}>Today's Tip</Text>
                <View style={styles.dailyTipContent}>
                  <Text style={styles.dailyTipIcon}>{dailyTip.icon}</Text>
                  <View style={styles.dailyTipText}>
                    <Text style={styles.dailyTipTitle}>{dailyTip.title}</Text>
                    <Text style={styles.dailyTipMessage}>{dailyTip.message}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Weekly Insights */}
            <Text style={styles.sectionTitle}>This Week's Analysis</Text>

            {insights.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>Not Enough Data</Text>
                <Text style={styles.emptyText}>
                  Log meals for a few days and come back for personalized insights!
                </Text>
              </View>
            ) : (
              insights.map(insight => {
                const colors = TYPE_COLORS[insight.type] || TYPE_COLORS.tip;
                return (
                  <View
                    key={insight.id}
                    style={[styles.insightCard, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}
                  >
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightIcon}>{insight.icon}</Text>
                      <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: colors.border + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: colors.border }]}>
                          {insight.type === 'celebration' ? 'Win' : insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.insightMessage, { color: colors.text + 'CC' }]}>
                      {insight.message}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  header: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },

  // Daily Tip
  dailyTipCard: {
    backgroundColor: Colors.primary + '12', borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  dailyTipHeader: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  dailyTipContent: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  dailyTipIcon: { fontSize: 32 },
  dailyTipText: { flex: 1 },
  dailyTipTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  dailyTipMessage: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Section
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.text,
    marginBottom: Spacing.md,
  },

  // Insight Cards
  insightCard: {
    borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderLeftWidth: 4,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  insightIcon: { fontSize: 22 },
  insightTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '700' },
  typeBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  insightMessage: { fontSize: FontSize.sm, lineHeight: 20, marginLeft: 30 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: {
    fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, paddingHorizontal: Spacing.xl,
  },
});
