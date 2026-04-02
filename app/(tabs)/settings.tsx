import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSettings, saveSettings, exportAllData, getProfile,
  AppSettings,
} from '../../services/storage';
import { UserProfile } from '../../types';
import {
  isFirebaseConfigured, getCurrentUser,
  reauthenticateWithPassword, deleteCurrentUser, signOut,
} from '../../services/firebase';
import { performFullSync, getLastSyncTime, deleteAllUserData } from '../../services/firestore';
import { rescheduleAll } from '../../services/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [s, p, syncTime] = await Promise.all([
        getSettings(),
        getProfile(),
        getLastSyncTime(),
      ]);
      setSettings(s);
      setProfile(p);
      setLastSync(syncTime);
    })();
  }, []));

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);

    // Reschedule notifications when relevant settings change
    if (['mealReminders', 'waterReminders', 'streakWarnings', 'reminderTimes'].includes(key as string)) {
      rescheduleAll(updated).catch(console.error);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      await Share.share({
        message: data,
        title: 'ChesterClub Data Export',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your food logs, weight history, Chester progress, and settings — including cloud data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export First', onPress: handleExportData },
        {
          text: 'Delete Everything', style: 'destructive', onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All data will be lost forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete All', style: 'destructive', onPress: async () => {
                    await deleteAllUserData();
                    Alert.alert('Data Cleared', 'All data has been deleted. The app will reset.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Not signed in', 'Sign in to delete your account.');
      return;
    }

    // Determine if user signed in with email/password
    const isEmailUser = user.providerData.some(p => p.providerId === 'password');

    const performDeletion = async (password?: string) => {
      try {
        if (isEmailUser && password) {
          await reauthenticateWithPassword(password);
        }
        await deleteAllUserData();
        await deleteCurrentUser();
        Alert.alert('Account Deleted', 'Your account and all data have been permanently deleted.');
      } catch (err: any) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          Alert.alert('Incorrect Password', 'The password you entered is wrong. Please try again.');
        } else if (err.code === 'auth/requires-recent-login') {
          Alert.alert(
            'Re-authentication Required',
            'For security, please sign out and sign back in, then try deleting your account again.'
          );
        } else {
          Alert.alert('Error', err.message || 'Could not delete account. Please try again.');
        }
      }
    };

    Alert.alert(
      'Delete Account',
      'This permanently deletes your account, all food logs, Chester progress, and cloud data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account', style: 'destructive', onPress: () => {
            if (isEmailUser) {
              // Prompt for password re-authentication
              Alert.prompt(
                'Confirm Password',
                'Enter your password to confirm account deletion.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete', style: 'destructive',
                    onPress: (password) => performDeletion(password ?? ''),
                  },
                ],
                'secure-text'
              );
            } else {
              // Google/Apple — attempt deletion directly
              performDeletion();
            }
          },
        },
      ]
    );
  };

  if (!settings || !profile) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.header} accessibilityRole="header">Settings</Text>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <SettingRow
              icon="restaurant-outline"
              label="Meal Reminders"
              subtitle="Remind you to log breakfast, lunch & dinner"
            >
              <Switch
                value={settings.mealReminders}
                onValueChange={(v) => updateSetting('mealReminders', v)}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor="#fff"
                accessibilityLabel="Meal reminders"
                accessibilityRole="switch"
              />
            </SettingRow>

            <SettingRow
              icon="water-outline"
              label="Water Reminders"
              subtitle="Remind you to drink water throughout the day"
            >
              <Switch
                value={settings.waterReminders}
                onValueChange={(v) => updateSetting('waterReminders', v)}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor="#fff"
                accessibilityLabel="Water reminders"
                accessibilityRole="switch"
              />
            </SettingRow>

            <SettingRow
              icon="flame-outline"
              label="Streak Warnings"
              subtitle="Alert when your streak is about to break"
              last
            >
              <Switch
                value={settings.streakWarnings}
                onValueChange={(v) => updateSetting('streakWarnings', v)}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor="#fff"
                accessibilityLabel="Streak warnings"
                accessibilityRole="switch"
              />
            </SettingRow>
          </View>
        </View>

        {/* Units */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units</Text>
          <View style={styles.card}>
            <SettingRow icon="scale-outline" label="Weight Unit" last>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitBtn, settings.weightUnit === 'kg' && styles.unitBtnActive]}
                  onPress={() => updateSetting('weightUnit', 'kg')}
                  accessibilityLabel="Kilograms"
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.weightUnit === 'kg' }}
                >
                  <Text style={[styles.unitBtnText, settings.weightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, settings.weightUnit === 'lbs' && styles.unitBtnActive]}
                  onPress={() => updateSetting('weightUnit', 'lbs')}
                  accessibilityLabel="Pounds"
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.weightUnit === 'lbs' }}
                >
                  <Text style={[styles.unitBtnText, settings.weightUnit === 'lbs' && styles.unitBtnTextActive]}>lbs</Text>
                </TouchableOpacity>
              </View>
            </SettingRow>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} accessibilityLabel="Profile and Goals" accessibilityRole="button">
              <SettingRow icon="person-outline" label="Profile & Goals" subtitle={profile.displayName || 'Friend'}>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </SettingRow>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(tabs)/premium')} accessibilityLabel="Premium" accessibilityRole="button">
              <SettingRow
                icon="diamond-outline"
                label="Premium"
                subtitle={profile.isPremiumMax ? 'Active - 2x coins' : 'Upgrade for more features'}
              >
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>
                    {profile.isPremiumMax ? 'Active' : 'Upgrade'}
                  </Text>
                </View>
              </SettingRow>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(tabs)/weight')} accessibilityLabel="Weight Tracker" accessibilityRole="button">
              <SettingRow icon="trending-down-outline" label="Weight Tracker" last>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </SettingRow>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cloud Sync */}
        {isFirebaseConfigured && getCurrentUser() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cloud Sync</Text>
            <View style={styles.card}>
              <TouchableOpacity
                onPress={async () => {
                  setSyncing(true);
                  const result = await performFullSync();
                  setSyncing(false);
                  if (result.success) {
                    const syncTime = await getLastSyncTime();
                    setLastSync(syncTime);
                    Alert.alert('Synced!', 'All your data has been synced to the cloud.');
                  } else {
                    Alert.alert('Sync Failed', result.error || 'Please try again.');
                  }
                }}
                disabled={syncing}
              >
                <SettingRow
                  icon="cloud-upload-outline"
                  label="Sync Now"
                  subtitle={lastSync ? `Last synced: ${new Date(lastSync).toLocaleString()}` : 'Never synced'}
                  last
                >
                  {syncing ? (
                    <Text style={styles.exportingText}>Syncing...</Text>
                  ) : (
                    <Ionicons name="sync" size={20} color={Colors.primary} />
                  )}
                </SettingRow>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={handleExportData} disabled={exporting} accessibilityLabel="Export data" accessibilityRole="button">
              <SettingRow
                icon="download-outline"
                label="Export Data"
                subtitle="Download all your food logs, weight & Chester data"
              >
                {exporting ? (
                  <Text style={styles.exportingText}>Exporting...</Text>
                ) : (
                  <Ionicons name="share-outline" size={20} color={Colors.primary} />
                )}
              </SettingRow>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClearData} accessibilityLabel="Clear all data" accessibilityRole="button">
              <SettingRow
                icon="trash-outline"
                label="Clear All Data"
                subtitle="Permanently delete all local and cloud data"
                destructive
              >
                <Ionicons name="chevron-forward" size={20} color={Colors.error} />
              </SettingRow>
            </TouchableOpacity>

            {getCurrentUser() && (
              <TouchableOpacity onPress={handleDeleteAccount} accessibilityLabel="Delete account" accessibilityRole="button">
                <SettingRow
                  icon="person-remove-outline"
                  label="Delete Account"
                  subtitle="Permanently delete your account and all data"
                  last
                  destructive
                >
                  <Ionicons name="chevron-forward" size={20} color={Colors.error} />
                </SettingRow>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingRow icon="paw-outline" label="ChesterClub" subtitle="Version 1.0.0">
              <Text style={styles.versionText}>v1.0.0</Text>
            </SettingRow>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/privacy-policy')}
              accessibilityLabel="Privacy Policy"
              accessibilityRole="button"
            >
              <SettingRow icon="shield-checkmark-outline" label="Privacy Policy">
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </SettingRow>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/terms-of-service')}
              accessibilityLabel="Terms of Service"
              accessibilityRole="button"
            >
              <SettingRow icon="document-text-outline" label="Terms of Service" last>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </SettingRow>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, subtitle, children, last, destructive }: {
  icon: string;
  label: string;
  subtitle?: string;
  children?: React.ReactNode;
  last?: boolean;
  destructive?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !last && styles.settingRowBorder]}>
      <View style={[styles.settingIcon, destructive && { backgroundColor: Colors.error + '15' }]}>
        <Ionicons name={icon as any} size={20} color={destructive ? Colors.error : Colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, destructive && { color: Colors.error }]}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  header: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },

  section: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: Spacing.sm, marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  settingSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  unitToggle: { flexDirection: 'row', borderRadius: BorderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  unitBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: Colors.background },
  unitBtnActive: { backgroundColor: Colors.primary },
  unitBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  unitBtnTextActive: { color: '#fff' },

  premiumBadge: {
    backgroundColor: '#FFD700' + '20', paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  premiumBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: '#B8860B' },

  exportingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  versionText: { fontSize: FontSize.sm, color: Colors.textLight },
});
