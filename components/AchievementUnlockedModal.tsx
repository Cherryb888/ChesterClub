import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { AchievementDefinition, RARITY_COLORS } from '../constants/achievements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  achievement: AchievementDefinition | null;
  visible: boolean;
  onClose: () => void;
}

// Simple confetti-like particles using Animated
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * SCREEN_WIDTH;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 100;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, { toValue: 400, duration: 2000, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: drift, duration: 2000, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.delay(1200),
          Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 80,
        left: startX,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

export default function AchievementUnlockedModal({ achievement, visible, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.5);
      fadeAnim.setValue(0);
      iconBounce.setValue(0.3);

      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        // Bounce the icon after card appears
        Animated.spring(iconBounce, { toValue: 1, tension: 80, friction: 4, useNativeDriver: true }).start();
      });
    }
  }, [visible]);

  if (!achievement) return null;

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const confettiColors = ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#CE93D8', '#FFB74D'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Confetti */}
        {visible && confettiColors.flatMap((color, ci) =>
          Array.from({ length: 4 }).map((_, i) => (
            <ConfettiParticle key={`${ci}-${i}`} delay={ci * 80 + i * 50} color={color} />
          ))
        )}

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Rarity banner */}
          <View style={[styles.rarityBanner, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityText}>
              {achievement.rarity.toUpperCase()}
            </Text>
          </View>

          {/* Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconBounce }] }]}>
            <View style={[styles.iconCircle, { borderColor: rarityColor, backgroundColor: rarityColor + '15' }]}>
              <Text style={styles.icon}>{achievement.icon}</Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={styles.unlockLabel}>Achievement Unlocked!</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>

          {/* Coin reward */}
          {achievement.coinReward > 0 && (
            <View style={styles.rewardRow}>
              <Text style={styles.rewardIcon}>🪙</Text>
              <Text style={styles.rewardText}>+{achievement.coinReward} coins</Text>
            </View>
          )}

          {/* Chester says */}
          <View style={styles.chesterSays}>
            <Text style={styles.chesterText}>
              Chester's tail is wagging like crazy! Way to go!
            </Text>
          </View>

          {/* Dismiss */}
          <TouchableOpacity style={[styles.button, { backgroundColor: rarityColor }]} onPress={onClose}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg + 4,
    padding: Spacing.xl || 24,
    paddingTop: 40,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  rarityBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: BorderRadius.lg + 4,
    borderTopRightRadius: BorderRadius.lg + 4,
  },
  rarityText: {
    display: 'none', // visual only via color bar
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
  },
  unlockLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl || 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  rewardIcon: {
    fontSize: 18,
  },
  rewardText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#B8860B',
  },
  chesterSays: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  chesterText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    paddingHorizontal: Spacing.xl || 24,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
