import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { StreakMilestone } from '../constants/streakRewards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  milestone: StreakMilestone | null;
  visible: boolean;
  onClose: () => void;
}

// Particle for fireworks/confetti effect
function Particle({ delay, color, startY }: { delay: number; color: string; startY: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * SCREEN_WIDTH;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 120;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, { toValue: 300 + Math.random() * 100, duration: 1800, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: drift, duration: 1800, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.delay(1000),
          Animated.timing(opacity, { toValue: 0, duration: 650, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: startY,
        left: startX,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

export default function StreakMilestoneModal({ milestone, visible, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fireScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.4);
      fadeAnim.setValue(0);
      fireScale.setValue(0.5);

      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        Animated.spring(fireScale, { toValue: 1, tension: 60, friction: 4, useNativeDriver: true }).start();
      });
    }
  }, [visible]);

  if (!milestone) return null;

  const isGolden = milestone.animation === 'goldenGlow';
  const particleColors = isGolden
    ? ['#FFD700', '#FFA000', '#FFE082', '#FF8F00', '#FFECB3']
    : ['#FF6B6B', '#FFD93D', '#4FC3F7', '#81C784', '#CE93D8', '#FFB74D'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }, isGolden && styles.overlayGolden]}>
        {/* Particles */}
        {visible && particleColors.flatMap((color, ci) =>
          Array.from({ length: 5 }).map((_, i) => (
            <Particle
              key={`${ci}-${i}`}
              delay={ci * 60 + i * 40}
              color={color}
              startY={isGolden ? 60 : 40}
            />
          ))
        )}

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]} accessibilityRole="alert" accessibilityLabel={`Streak milestone: ${milestone.day} day streak! ${milestone.chesterMessage}`}>
          {/* Top accent */}
          <View style={[styles.topAccent, isGolden && styles.topAccentGolden]} />

          {/* Fire emoji */}
          <Animated.View style={{ transform: [{ scale: fireScale }] }}>
            <Text style={styles.fireEmoji}>
              {milestone.day >= 60 ? '🔥🏆🔥' : milestone.day >= 30 ? '🔥⭐🔥' : '🔥'}
            </Text>
          </Animated.View>

          {/* Streak count */}
          <Text style={[styles.streakCount, isGolden && styles.streakCountGolden]}>
            {milestone.day}
          </Text>
          <Text style={styles.streakLabel}>Day Streak!</Text>

          {/* Chester message */}
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{milestone.chesterMessage}</Text>
          </View>

          {/* Rewards */}
          <View style={styles.rewardsSection}>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardIcon}>🪙</Text>
              <Text style={styles.rewardText}>+{milestone.coins} coins</Text>
            </View>
            {milestone.shopUnlock && (
              <View style={styles.rewardRow}>
                <Text style={styles.rewardIcon}>🎁</Text>
                <Text style={styles.rewardText}>Shop item unlocked!</Text>
              </View>
            )}
          </View>

          {/* Dismiss */}
          <TouchableOpacity
            style={[styles.button, isGolden && styles.buttonGolden]}
            onPress={onClose}
            accessibilityLabel="Dismiss streak milestone"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Amazing!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  overlayGolden: {
    backgroundColor: 'rgba(50,30,0,0.7)',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg + 4,
    padding: Spacing.xl || 24,
    paddingTop: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 6,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: BorderRadius.lg + 4,
    borderTopRightRadius: BorderRadius.lg + 4,
  },
  topAccentGolden: {
    backgroundColor: '#FFD700',
  },
  fireEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  streakCount: {
    fontSize: 56,
    fontWeight: '900',
    color: Colors.primary,
    lineHeight: 60,
  },
  streakCountGolden: {
    color: '#FFD700',
  },
  streakLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  messageBubble: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  messageText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  rewardsSection: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700' + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  rewardIcon: { fontSize: 16 },
  rewardText: { fontSize: FontSize.sm, fontWeight: '700', color: '#B8860B' },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl || 24,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonGolden: {
    backgroundColor: '#FFD700',
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
