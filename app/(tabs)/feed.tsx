import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getCurrentUser } from '../../services/firebase';
import { getFriendFeed, FeedItem, FeedItemType } from '../../services/feedService';
import ScreenHeader from '../../components/ui/ScreenHeader';
import EmptyState from '../../components/ui/EmptyState';
import LoadingScreen from '../../components/ui/LoadingScreen';

const TYPE_STYLES: Record<FeedItemType, { bg: string; accent: string }> = {
  meal: { bg: Colors.primary + '10', accent: Colors.primary },
  streak_milestone: { bg: '#FFF3E0', accent: '#FF9800' },
  achievement: { bg: '#E8F5E9', accent: '#4CAF50' },
  level_up: { bg: '#E3F2FD', accent: '#2196F3' },
  life_stage: { bg: '#F3E5F5', accent: '#9C27B0' },
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function FeedScreen() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const isSignedIn = getCurrentUser() !== null;

  const loadFeed = useCallback(async () => {
    if (!isSignedIn) { setLoading(false); return; }
    const feed = await getFriendFeed();
    setItems(feed);
    setLoading(false);
  }, [isSignedIn]);

  useFocusEffect(useCallback(() => { loadFeed(); }, [loadFeed]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <ScreenHeader title="Activity Feed" />

        {!isSignedIn ? (
          <EmptyState
            icon="📡"
            title="Sign In to See Activity"
            message="Sign in and add friends to see their milestones and meals!"
            buttonLabel="Sign In"
            onPress={() => router.push('/(tabs)/auth')}
          />
        ) : loading ? (
          <LoadingScreen />
        ) : items.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No Activity Yet"
            message="When you or your friends log meals, hit milestones, or unlock achievements, it'll show up here!"
            buttonLabel="Add Friends"
            onPress={() => router.push('/(tabs)/friends')}
          />
        ) : (
          items.map(item => {
            const style = TYPE_STYLES[item.type] || TYPE_STYLES.meal;
            return (
              <View key={item.id} style={[styles.feedCard, { backgroundColor: style.bg }]}>
                <View style={styles.feedHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: style.accent + '20' }]}>
                    <Text style={styles.feedIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.feedInfo}>
                    <Text style={styles.feedName}>
                      {item.isMe ? 'You' : item.displayName}
                    </Text>
                    <Text style={styles.feedTime}>{timeAgo(item.timestamp)}</Text>
                  </View>
                </View>
                <Text style={[styles.feedTitle, { color: style.accent }]}>{item.title}</Text>
                <Text style={styles.feedSubtitle}>{item.subtitle}</Text>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  // Feed card
  feedCard: {
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm,
  },
  feedIcon: { fontSize: 20 },
  feedInfo: { flex: 1 },
  feedName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  feedTime: { fontSize: FontSize.xs, color: Colors.textLight },
  feedTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: 2 },
  feedSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

});
