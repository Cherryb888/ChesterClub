import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { canDigToday, performDig, getDailyDigState } from '../../services/storage';
import { DigReward, RARITY_INFO } from '../../constants/dailyDig';
import ChesterDigAnimation from '../../components/Chester/ChesterDigAnimation';

type Phase = 'idle' | 'digging' | 'reveal' | 'already_dug';

export default function DailyDigScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [reward, setReward] = useState<DigReward | null>(null);
  const [canDig, setCanDig] = useState(false);
  const [totalDigs, setTotalDigs] = useState(0);

  // Reward reveal animations
  const [rewardFade] = useState(new Animated.Value(0));
  const [rewardScale] = useState(new Animated.Value(0.5));
  const [glowAnim] = useState(new Animated.Value(0));

  const loadState = useCallback(async () => {
    const available = await canDigToday();
    setCanDig(available);
    const state = await getDailyDigState();
    setTotalDigs(state.history.length);
    if (!available && state.todayReward) {
      setReward(state.todayReward);
      setPhase('already_dug');
    } else {
      setPhase('idle');
      setReward(null);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadState(); }, [loadState]));

  const handleDig = async () => {
    if (!canDig) return;

    setPhase('digging');

    // Wait for dig animation to play (2 seconds)
    setTimeout(async () => {
      try {
        const digReward = await performDig();
        setReward(digReward);
        setPhase('reveal');
        setCanDig(false);

        // Animate reward reveal
        Animated.parallel([
          Animated.timing(rewardFade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(rewardScale, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }),
        ]).start();

        // Glow for rare+
        if (digReward.rarity === 'rare' || digReward.rarity === 'super_rare') {
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(glowAnim, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
          ).start();
        }
      } catch {
        setPhase('already_dug');
      }
    }, 2000);
  };

  const rarityInfo = reward ? RARITY_INFO[reward.rarity] : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">Chester's Daily Dig</Text>
        <Text style={styles.subtitle}>
          {phase === 'idle' && canDig ? 'Tap the ground to let Chester dig!' :
           phase === 'digging' ? 'Chester is digging...' :
           phase === 'reveal' ? 'Chester found something!' :
           'Chester already dug today! Come back tomorrow.'}
        </Text>

        {/* Dig animation */}
        <View style={styles.digArea}>
          <ChesterDigAnimation
            phase={phase === 'already_dug' ? 'idle' : phase}
            size={220}
          />
        </View>

        {/* Dig button */}
        {phase === 'idle' && canDig && (
          <TouchableOpacity style={styles.digButton} onPress={handleDig} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Let Chester dig" accessibilityHint="Chester will dig for a random reward">
            <Text style={styles.digButtonIcon}>🐾</Text>
            <Text style={styles.digButtonText}>Let Chester Dig!</Text>
          </TouchableOpacity>
        )}

        {/* Reward reveal */}
        {(phase === 'reveal' || phase === 'already_dug') && reward && (
          <Animated.View style={[
            styles.rewardCard,
            {
              opacity: phase === 'already_dug' ? 1 : rewardFade,
              transform: [{ scale: phase === 'already_dug' ? 1 : rewardScale }],
              borderColor: rarityInfo?.color || Colors.border,
            },
          ]}
            accessibilityLabel={`Reward: ${reward.title}, ${rarityInfo?.label || ''} rarity. ${reward.description}`}
          >
            {/* Rarity glow for rare+ */}
            {(reward.rarity === 'rare' || reward.rarity === 'super_rare') && phase === 'reveal' && (
              <Animated.View style={[styles.rewardGlow, {
                backgroundColor: rarityInfo?.glow,
                opacity: glowAnim,
              }]} />
            )}

            <View style={styles.rewardHeader}>
              <Text style={styles.rewardIcon}>{reward.icon}</Text>
              <View style={styles.rewardTitleRow}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <View style={[styles.rarityBadge, { backgroundColor: rarityInfo?.color + '20' }]}>
                  <Text style={[styles.rarityText, { color: rarityInfo?.color }]}>{rarityInfo?.label}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.rewardDescription}>{reward.description}</Text>

            {reward.type === 'fun_title' && reward.titleText && (
              <View style={styles.titlePreview}>
                <Text style={styles.titlePreviewLabel}>Your title for today:</Text>
                <Text style={styles.titlePreviewText}>{reward.titleText}</Text>
              </View>
            )}

            {reward.type === 'exclusive_item' && (
              <View style={styles.exclusiveHint}>
                <Text style={styles.exclusiveHintText}>Check the shop to equip your new item!</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Already dug message */}
        {phase === 'already_dug' && !reward && (
          <View style={styles.alreadyDugCard} accessibilityLabel="Chester's tired from digging today. Come back tomorrow for another dig.">
            <Text style={styles.alreadyDugIcon}>😴</Text>
            <Text style={styles.alreadyDugText}>Chester's tired from digging today!</Text>
            <Text style={styles.alreadyDugSub}>Come back tomorrow for another dig.</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow} accessibilityLabel={`Total digs: ${totalDigs}`}>
          <Text style={styles.statsText}>Total digs: {totalDigs}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  backBtn: { padding: Spacing.md },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.lg },

  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },

  digArea: { marginVertical: Spacing.lg },

  // Dig button
  digButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#8B6914', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    shadowColor: '#8B6914', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  digButtonIcon: { fontSize: 24 },
  digButtonText: { fontSize: FontSize.lg, fontWeight: '800', color: '#FFF8E1' },

  // Reward card
  rewardCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: Spacing.lg,
    width: '100%', borderWidth: 2, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  rewardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
  },
  rewardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  rewardIcon: { fontSize: 36 },
  rewardTitleRow: { flex: 1 },
  rewardTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  rarityBadge: {
    alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full, marginTop: 4,
  },
  rarityText: { fontSize: FontSize.xs, fontWeight: '700' },
  rewardDescription: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },

  // Fun title preview
  titlePreview: {
    marginTop: Spacing.md, backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center',
  },
  titlePreviewLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  titlePreviewText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary, marginTop: 4 },

  // Exclusive item hint
  exclusiveHint: {
    marginTop: Spacing.md, backgroundColor: '#FF6B6B' + '10',
    borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center',
  },
  exclusiveHintText: { fontSize: FontSize.sm, fontWeight: '600', color: '#FF6B6B' },

  // Already dug
  alreadyDugCard: {
    backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: Spacing.xl,
    alignItems: 'center', width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  alreadyDugIcon: { fontSize: 48, marginBottom: Spacing.sm },
  alreadyDugText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  alreadyDugSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },

  // Stats
  statsRow: { marginTop: Spacing.lg, opacity: 0.5 },
  statsText: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
