import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getProfile, saveProfile } from '../../services/storage';
import { UserProfile, UserGoals } from '../../types';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editGoals, setEditGoals] = useState<UserGoals>({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 });
  const [editName, setEditName] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
      setEditGoals(p.goals);
      setEditName(p.displayName);
    })();
  }, []));

  const saveChanges = async () => {
    if (!profile) return;
    const updated = { ...profile, displayName: editName, goals: editGoals };
    await saveProfile(updated);
    setProfile(updated);
    setEditing(false);
    Alert.alert('Saved!', 'Chester updated your profile! 🐕');
  };

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Profile & Settings</Text>

        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(profile.displayName || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              {editing ? (
                <TextInput
                  style={styles.nameInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                />
              ) : (
                <Text style={styles.profileName}>{profile.displayName || 'Friend'}</Text>
              )}
              <Text style={styles.profileEmail}>{profile.email || 'Local account'}</Text>
            </View>
          </View>
        </View>

        {/* Goals Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily Goals</Text>
            <TouchableOpacity onPress={() => editing ? saveChanges() : setEditing(true)}>
              <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <GoalRow
            icon="flame" label="Calories" value={editGoals.dailyCalories} unit="cal" color={Colors.calories}
            editing={editing} onChange={(v) => setEditGoals({ ...editGoals, dailyCalories: v })}
          />
          <GoalRow
            icon="barbell" label="Protein" value={editGoals.dailyProtein} unit="g" color={Colors.protein}
            editing={editing} onChange={(v) => setEditGoals({ ...editGoals, dailyProtein: v })}
          />
          <GoalRow
            icon="nutrition" label="Carbs" value={editGoals.dailyCarbs} unit="g" color={Colors.carbs}
            editing={editing} onChange={(v) => setEditGoals({ ...editGoals, dailyCarbs: v })}
          />
          <GoalRow
            icon="water" label="Fat" value={editGoals.dailyFat} unit="g" color={Colors.fat}
            editing={editing} onChange={(v) => setEditGoals({ ...editGoals, dailyFat: v })}
          />
        </View>

        {/* Chester Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chester Stats</Text>
          <View style={styles.chesterStats}>
            <StatItem label="Level" value={String(profile.chester.level)} />
            <StatItem label="XP" value={`${profile.chester.xp}/${profile.chester.level * 100}`} />
            <StatItem label="Streak" value={`${profile.chester.streak} days`} />
            <StatItem label="Mood" value={profile.chester.mood} />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.aboutText}>ChesterClub v1.0.0</Text>
          <Text style={styles.aboutText}>AI-powered food scanner & macro tracker</Text>
          <Text style={styles.aboutText}>Your companion Chester is always here to help!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalRow({ icon, label, value, unit, color, editing, onChange }: {
  icon: string; label: string; value: number; unit: string; color: string;
  editing: boolean; onChange: (v: number) => void;
}) {
  return (
    <View style={styles.goalRow}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.goalLabel}>{label}</Text>
      {editing ? (
        <TextInput
          style={styles.goalInput}
          value={String(value)}
          onChangeText={(t) => onChange(parseInt(t) || 0)}
          keyboardType="numeric"
        />
      ) : (
        <Text style={[styles.goalValue, { color }]}>{value} {unit}</Text>
      )}
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  header: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  editBtn: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primary },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  nameInput: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingBottom: 4 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  goalLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  goalValue: { fontSize: FontSize.md, fontWeight: '700' },
  goalInput: { width: 80, fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, textAlign: 'right', borderBottomWidth: 2, borderBottomColor: Colors.primary },
  chesterStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  aboutText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
});
