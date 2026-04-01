import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { ACHIEVEMENTS, AchievementDefinition, RARITY_COLORS, AchievementRarity } from '../../constants/achievements';
import { getProfile } from '../../services/storage';

export default function BadgesScreen() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [selected, setSelected] = useState<AchievementDefinition | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      const profile = await getProfile();
      setUnlocked(profile.chester.achievements);
    })();
  }, []));

  const unlockedCount = ACHIEVEMENTS.filter(a => unlocked.includes(a.id)).length;

  const groupByRarity = (rarity: AchievementRarity) =>
    ACHIEVEMENTS.filter(a => a.rarity === rarity);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title="Badges"
          rightElement={<Text style={styles.counter}>{unlockedCount}/{ACHIEVEMENTS.length}</Text>}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress bar */}
        <View style={styles.progressContainer} accessibilityLabel={`Badge progress: ${unlockedCount} of ${ACHIEVEMENTS.length} unlocked, ${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% complete`}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% Complete
          </Text>
        </View>

        {/* Badges by rarity */}
        {(['legendary', 'epic', 'rare', 'common'] as AchievementRarity[]).map(rarity => {
          const badges = groupByRarity(rarity);
          if (badges.length === 0) return null;
          return (
            <View key={rarity} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
                <Text style={[styles.sectionTitle, { color: RARITY_COLORS[rarity] }]} accessibilityRole="header">
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </Text>
                <Text style={styles.sectionCount}>
                  {badges.filter(b => unlocked.includes(b.id)).length}/{badges.length}
                </Text>
              </View>
              <View style={styles.badgesGrid}>
                {badges.map(badge => {
                  const isUnlocked = unlocked.includes(badge.id);
                  return (
                    <TouchableOpacity
                      key={badge.id}
                      style={[
                        styles.badgeCard,
                        isUnlocked && { borderColor: RARITY_COLORS[badge.rarity] + '60' },
                      ]}
                      onPress={() => setSelected(badge)}
                      accessibilityRole="button"
                      accessibilityLabel={isUnlocked ? `${badge.title}, ${badge.rarity} badge, unlocked` : `Locked ${badge.rarity} badge`}
                      accessibilityHint="Double tap to view badge details"
                    >
                      <View style={[
                        styles.badgeIcon,
                        !isUnlocked && styles.badgeIconLocked,
                        isUnlocked && { backgroundColor: RARITY_COLORS[badge.rarity] + '15' },
                      ]}>
                        <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeEmojiLocked]}>
                          {isUnlocked ? badge.icon : '?'}
                        </Text>
                      </View>
                      <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]} numberOfLines={1}>
                        {isUnlocked ? badge.title : '???'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Badge Detail Modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelected(null)}
          accessibilityRole="button"
          accessibilityLabel="Close badge details"
        >
          {selected && (
            <View style={styles.modalCard}>
              <View style={[styles.modalRarityBar, { backgroundColor: RARITY_COLORS[selected.rarity] }]} />
              <View style={[
                styles.modalIconCircle,
                { borderColor: RARITY_COLORS[selected.rarity] },
                unlocked.includes(selected.id) && { backgroundColor: RARITY_COLORS[selected.rarity] + '15' },
              ]}>
                <Text style={styles.modalIcon}>
                  {unlocked.includes(selected.id) ? selected.icon : '🔒'}
                </Text>
              </View>
              <View style={[styles.modalRarityPill, { backgroundColor: RARITY_COLORS[selected.rarity] + '20' }]}>
                <Text style={[styles.modalRarityText, { color: RARITY_COLORS[selected.rarity] }]}>
                  {selected.rarity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.modalTitle} accessibilityRole="header">
                {unlocked.includes(selected.id) ? selected.title : '???'}
              </Text>
              <Text style={styles.modalDesc}>
                {unlocked.includes(selected.id) ? selected.description : selected.hint}
              </Text>
              {selected.coinReward > 0 && (
                <View style={styles.modalReward}>
                  <Text style={styles.modalRewardText}>🪙 {selected.coinReward} coins</Text>
                </View>
              )}
              {unlocked.includes(selected.id) ? (
                <View style={styles.modalUnlockedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.modalUnlockedText}>Unlocked</Text>
                </View>
              ) : (
                <View style={styles.modalLockedBadge}>
                  <Ionicons name="lock-closed" size={16} color={Colors.textLight} />
                  <Text style={styles.modalLockedText}>Locked</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerWrap: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  counter: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  // Progress
  progressContainer: { marginBottom: Spacing.lg },
  progressBar: {
    height: 8, backgroundColor: Colors.border, borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },

  // Sections
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  rarityDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', flex: 1 },
  sectionCount: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Badge Grid
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeCard: {
    width: '22%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
    marginBottom: 4,
  },
  badgeIconLocked: { backgroundColor: Colors.border + '40' },
  badgeEmoji: { fontSize: 22 },
  badgeEmojiLocked: { fontSize: 18, opacity: 0.4 },
  badgeName: { fontSize: 10, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  badgeNameLocked: { color: Colors.textLight },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg + 4,
    padding: Spacing.lg, paddingTop: 36, width: '100%', maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  modalRarityBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 5,
    borderTopLeftRadius: BorderRadius.lg + 4, borderTopRightRadius: BorderRadius.lg + 4,
  },
  modalIconCircle: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 3,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalIcon: { fontSize: 36 },
  modalRarityPill: {
    paddingHorizontal: Spacing.md, paddingVertical: 3,
    borderRadius: BorderRadius.full, marginBottom: Spacing.sm,
  },
  modalRarityText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 4 },
  modalDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },
  modalReward: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFD700' + '15', paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: BorderRadius.full, marginBottom: Spacing.sm,
  },
  modalRewardText: { fontSize: FontSize.sm, fontWeight: '700', color: '#B8860B' },
  modalUnlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalUnlockedText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.success },
  modalLockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalLockedText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textLight },
});
