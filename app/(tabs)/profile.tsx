import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getProfile, saveProfile, getChesterLifeStage, LIFE_STAGE_INFO } from '../../services/storage';
import { UserProfile, UserGoals } from '../../types';

const CHESTER_IMAGE = require('../../assets/chester/chester-happy.png');

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editGoals, setEditGoals] = useState<UserGoals>({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65, dailyWaterGlasses: 8 });
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
        <Text style={styles.header} accessibilityRole="header">Profile & Settings</Text>

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
                  accessibilityLabel="Display name"
                  accessibilityHint="Enter your display name"
                />
              ) : (
                <Text style={styles.profileName}>{profile.displayName || 'Friend'}</Text>
              )}
              <Text style={styles.profileEmail}>{profile.email || 'Local account'}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/auth')} style={styles.accountLink} accessibilityRole="button" accessibilityLabel={profile.email ? 'Manage Account' : 'Sign In or Create Account'}>
                <Text style={styles.accountLinkText}>
                  {profile.email ? 'Manage Account' : 'Sign In / Create Account'}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Goals Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} accessibilityRole="header">Daily Goals</Text>
            <TouchableOpacity onPress={() => editing ? saveChanges() : setEditing(true)} accessibilityRole="button" accessibilityLabel={editing ? 'Save daily goals' : 'Edit daily goals'}>
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
          <GoalRow
            icon="water" label="Water" value={editGoals.dailyWaterGlasses} unit="glasses" color="#4FC3F7"
            editing={editing} onChange={(v) => setEditGoals({ ...editGoals, dailyWaterGlasses: v })}
          />
        </View>

        {/* Chester Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">Chester Stats</Text>
          <View style={styles.chesterProfileRow}>
            <View style={styles.chesterImageSmall}>
              <Image source={CHESTER_IMAGE} style={styles.chesterImg} resizeMode="cover" accessibilityLabel="Chester the dog" />
            </View>
            <View style={styles.chesterStats}>
              <StatItem label="Level" value={String(profile.chester.level)} />
              <StatItem label="XP" value={`${profile.chester.xp}/${profile.chester.level * 100}`} />
              <StatItem label="Streak" value={`${profile.chester.streak} days`} />
              <StatItem label="Mood" value={profile.chester.mood} />
              <StatItem label="Coins" value={`${profile.chester.coins}`} />
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">More</Text>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(tabs)/weight')} accessibilityRole="button" accessibilityLabel="Weight Tracker">
            <Ionicons name="trending-down" size={20} color={Colors.primary} />
            <Text style={styles.linkText}>Weight Tracker</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(tabs)/premium')} accessibilityRole="button" accessibilityLabel="Premium">
            <Ionicons name="diamond" size={20} color="#FFD700" />
            <Text style={styles.linkText}>Premium</Text>
            {profile.isPremiumMax && (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Active</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderBottomWidth: 0 }]} onPress={() => router.push('/(tabs)/settings')} accessibilityRole="button" accessibilityLabel="Settings">
            <Ionicons name="settings" size={20} color={Colors.textSecondary} />
            <Text style={styles.linkText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">About</Text>
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
          accessibilityLabel={`${label} goal`}
          accessibilityHint={`Enter your daily ${label.toLowerCase()} goal in ${unit}`}
        />
      ) : (
        <Text style={[styles.goalValue, { color }]}>{value} {unit}</Text>
      )}
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem} accessibilityLabel={`${label}: ${value}`}>
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
  accountLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  accountLinkText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  nameInput: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingBottom: 4 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  goalLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  goalValue: { fontSize: FontSize.md, fontWeight: '700' },
  goalInput: { width: 80, fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, textAlign: 'right', borderBottomWidth: 2, borderBottomColor: Colors.primary },
  chesterProfileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chesterImageSmall: {
    width: 56, height: 56, borderRadius: 28, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.primary, backgroundColor: '#FFF8F0',
  },
  chesterImg: { width: '100%', height: '100%' },
  chesterStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  linkText: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  activePill: {
    backgroundColor: Colors.success + '20', paddingHorizontal: Spacing.sm,
    paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  activePillText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.success },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  aboutText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
});
