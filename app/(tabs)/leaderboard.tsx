import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getCurrentUser } from '../../services/firebase';
import { getFriendsList, FriendProfile, getLifeStageEmoji } from '../../services/friendsService';
import { getProfile } from '../../services/storage';
import ScreenHeader from '../../components/ui/ScreenHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingScreen from '../../components/ui/LoadingScreen';

type LeaderboardCategory = 'streak' | 'level' | 'badges';

interface LeaderboardEntry {
  uid: string;
  name: string;
  value: number;
  lifeStage: string;
  isMe: boolean;
}

const CATEGORY_CONFIG: Record<LeaderboardCategory, { title: string; icon: string; suffix: string }> = {
  streak: { title: 'Streak', icon: '🔥', suffix: ' days' },
  level: { title: 'Level', icon: '⭐', suffix: '' },
  badges: { title: 'Badges', icon: '🏅', suffix: '' },
};

export default function LeaderboardScreen() {
  const [category, setCategory] = useState<LeaderboardCategory>('streak');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isSignedIn = getCurrentUser() !== null;

  const loadData = useCallback(async () => {
    setLoading(true);
    if (!isSignedIn) { setLoading(false); return; }

    const profile = await getProfile();
    const friends = await getFriendsList();

    // Build entries: me + friends
    const me: LeaderboardEntry = {
      uid: 'me',
      name: profile.displayName || 'You',
      value: 0,
      lifeStage: getLifeStageFromLevel(profile.chester.level),
      isMe: true,
    };

    const all: LeaderboardEntry[] = [
      me,
      ...friends.map(f => ({
        uid: f.uid,
        name: f.displayName,
        value: 0,
        lifeStage: f.lifeStage,
        isMe: false,
      })),
    ];

    // Assign values based on current category
    all[0].value = category === 'streak' ? profile.chester.streak
      : category === 'level' ? profile.chester.level
      : profile.chester.achievements.length;

    for (let i = 1; i < all.length; i++) {
      const friend = friends[i - 1];
      all[i].value = category === 'streak' ? friend.streak
        : category === 'level' ? friend.chesterLevel
        : friend.achievementCount;
    }

    // Sort descending
    all.sort((a, b) => b.value - a.value);

    setEntries(all);
    setLoading(false);
  }, [isSignedIn, category]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const config = CATEGORY_CONFIG[category];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Leaderboard" />

        {/* Category Tabs */}
        <View style={styles.tabRow}>
          {(['streak', 'level', 'badges'] as LeaderboardCategory[]).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, category === cat && styles.tabActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={styles.tabEmoji}>{CATEGORY_CONFIG[cat].icon}</Text>
              <Text style={[styles.tabText, category === cat && styles.tabTextActive]}>
                {CATEGORY_CONFIG[cat].title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isSignedIn ? (
          <EmptyState
            icon="🏆"
            title="Sign In to Compete"
            message="Sign in and add friends to see who's on top!"
            buttonLabel="Sign In"
            onPress={() => router.push('/(tabs)/auth')}
          />
        ) : loading ? (
          <LoadingScreen />
        ) : entries.length <= 1 ? (
          <EmptyState
            icon="👥"
            title="Add Friends First"
            message="Add friends to compete on the leaderboard!"
            buttonLabel="Add Friends"
            onPress={() => router.push('/(tabs)/friends')}
          />
        ) : (
          <>
            {/* Podium for top 3 */}
            {entries.length >= 3 && (
              <View style={styles.podium}>
                <PodiumSlot entry={entries[1]} rank={2} />
                <PodiumSlot entry={entries[0]} rank={1} />
                <PodiumSlot entry={entries[2]} rank={3} />
              </View>
            )}

            {/* Full ranking list */}
            {entries.map((entry, index) => (
              <View
                key={entry.uid}
                style={[styles.rankRow, entry.isMe && styles.rankRowMe]}
              >
                <Text style={[styles.rankNumber, index < 3 && styles.rankNumberTop]}>
                  {index + 1}
                </Text>
                <Text style={styles.rankEmoji}>{getLifeStageEmoji(entry.lifeStage)}</Text>
                <View style={styles.rankInfo}>
                  <Text style={[styles.rankName, entry.isMe && styles.rankNameMe]}>
                    {entry.name}{entry.isMe ? ' (You)' : ''}
                  </Text>
                </View>
                <Text style={[styles.rankValue, index === 0 && styles.rankValueFirst]}>
                  {entry.value}{config.suffix}
                </Text>
                {index === 0 && <Text style={styles.crownEmoji}>👑</Text>}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PodiumSlot({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const heights = { 1: 100, 2: 75, 3: 55 };
  const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  return (
    <View style={styles.podiumSlot}>
      <Text style={styles.podiumEmoji}>{getLifeStageEmoji(entry.lifeStage)}</Text>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>
      <View style={[styles.podiumBar, { height: heights[rank as 1|2|3], backgroundColor: colors[rank as 1|2|3] + '40' }]}>
        <Text style={[styles.podiumRank, { color: colors[rank as 1|2|3] }]}>#{rank}</Text>
        <Text style={styles.podiumValue}>{entry.value}</Text>
      </View>
    </View>
  );
}

function getLifeStageFromLevel(level: number): string {
  if (level >= 50) return 'golden';
  if (level >= 31) return 'champion';
  if (level >= 16) return 'adult';
  if (level >= 6) return 'young';
  return 'puppy';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  // Tabs
  tabRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabEmoji: { fontSize: 16 },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  // Podium
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    gap: Spacing.sm, marginBottom: Spacing.xl, paddingTop: Spacing.lg,
  },
  podiumSlot: { flex: 1, alignItems: 'center' },
  podiumEmoji: { fontSize: 28, marginBottom: 4 },
  podiumName: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  podiumBar: {
    width: '100%', borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.sm,
  },
  podiumRank: { fontSize: FontSize.lg, fontWeight: '800' },
  podiumValue: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },

  // Rank list
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.xs,
  },
  rankRowMe: { borderWidth: 2, borderColor: Colors.primary + '50', backgroundColor: Colors.primary + '08' },
  rankNumber: { width: 28, fontSize: FontSize.md, fontWeight: '700', color: Colors.textLight, textAlign: 'center' },
  rankNumberTop: { color: Colors.primary },
  rankEmoji: { fontSize: 22, marginRight: Spacing.sm },
  rankInfo: { flex: 1 },
  rankName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  rankNameMe: { fontWeight: '800', color: Colors.primary },
  rankValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  rankValueFirst: { color: Colors.primary },
  crownEmoji: { fontSize: 16, marginLeft: 4 },

});
