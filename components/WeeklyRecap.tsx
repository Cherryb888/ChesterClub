import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface WeeklyStats {
  totalMeals: number;
  avgCalories: number;
  avgNutritionScore: number;
  waterGoalDays: number;
  streakCurrent: number;
  daysLogged: number;
}

interface Props {
  stats: WeeklyStats | null;
  visible: boolean;
  onClose: () => void;
}

function getGrade(score: number): { label: string; emoji: string; color: string } {
  if (score >= 90) return { label: 'Outstanding', emoji: '🌟', color: Colors.success };
  if (score >= 75) return { label: 'Great', emoji: '⭐', color: Colors.primary };
  if (score >= 60) return { label: 'Good', emoji: '👍', color: Colors.primary };
  if (score >= 40) return { label: 'Okay', emoji: '🤔', color: Colors.warning };
  return { label: 'Needs Work', emoji: '💪', color: Colors.error };
}

function getChesterComment(stats: WeeklyStats): string {
  if (stats.daysLogged >= 7 && stats.avgNutritionScore >= 80) {
    return "A perfect week! Chester's never been more proud! You're a true champion!";
  }
  if (stats.daysLogged >= 6) {
    return "Almost every day logged! Chester's wagging his tail so fast it's a blur!";
  }
  if (stats.daysLogged >= 4) {
    return "Good effort this week! Chester sees you building great habits!";
  }
  if (stats.daysLogged >= 2) {
    return "A decent start! Chester knows you can do even better next week!";
  }
  return "Chester missed you this week! Let's make next week amazing together!";
}

export default function WeeklyRecap({ stats, visible, onClose }: Props) {
  if (!stats) return null;

  const grade = getGrade(stats.avgNutritionScore);
  const comment = getChesterComment(stats);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>📊</Text>
            <Text style={styles.headerTitle} accessibilityRole="header">Weekly Recap</Text>
          </View>

          {/* Grade */}
          <View style={[styles.gradeBadge, { backgroundColor: grade.color + '15' }]}>
            <Text style={styles.gradeEmoji}>{grade.emoji}</Text>
            <Text style={[styles.gradeText, { color: grade.color }]}>{grade.label} Week</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatBox label="Days Logged" value={`${stats.daysLogged}/7`} icon="📅" />
            <StatBox label="Total Meals" value={String(stats.totalMeals)} icon="🍽️" />
            <StatBox label="Avg Calories" value={String(stats.avgCalories)} icon="🔥" />
            <StatBox label="Avg Score" value={String(stats.avgNutritionScore)} icon="⭐" />
            <StatBox label="Water Goals" value={`${stats.waterGoalDays}/7`} icon="💧" />
            <StatBox label="Streak" value={`${stats.streakCurrent}🔥`} icon="" />
          </View>

          {/* Chester says */}
          <View style={styles.commentBox}>
            <Text style={styles.commentLabel}>Chester says:</Text>
            <Text style={styles.commentText}>{comment}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose} accessibilityLabel="Dismiss weekly recap" accessibilityRole="button">
            <Text style={styles.buttonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statBox} accessibilityLabel={`${label}: ${value}`}>
      {icon ? <Text style={styles.statIcon}>{icon}</Text> : null}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg + 4,
    padding: Spacing.lg, width: '100%', maxWidth: 360,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 10,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginBottom: Spacing.md,
  },
  headerEmoji: { fontSize: 24 },
  headerTitle: { fontSize: FontSize.xl || 22, fontWeight: '800', color: Colors.text },

  gradeBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, marginBottom: Spacing.md,
  },
  gradeEmoji: { fontSize: 18 },
  gradeText: { fontSize: FontSize.md, fontWeight: '700' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md,
  },
  statBox: {
    width: '30%', backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center',
  },
  statIcon: { fontSize: 16, marginBottom: 2 },
  statValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },

  commentBox: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  commentLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  commentText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },

  button: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
