import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { ChesterState, ChesterLifeStage } from '../../types';
import { getChesterLifeStage, LIFE_STAGE_INFO } from '../../services/storage';
import { getEquippedItems } from '../../services/shopService';
import { getShopItemById, BACKGROUND_COLORS } from '../../constants/shopItems';

// Single image for now — replace with stage-specific images later
const CHESTER_IMAGE = require('../../assets/chester/chester-happy.png');

interface Props {
  chester: ChesterState;
  size?: 'small' | 'medium' | 'large';
  showInfo?: boolean;
}

const MOOD_LABELS: Record<ChesterState['mood'], string> = {
  happy: 'Happy',
  excited: 'Excited!',
  neutral: 'Chillin',
  hungry: 'Hungry...',
  sleepy: 'Sleepy',
  sad: 'Needs you...',
};

const MOOD_COLORS: Record<ChesterState['mood'], string> = {
  happy: Colors.success,
  excited: '#FF6B35',
  neutral: Colors.textSecondary,
  hungry: Colors.warning,
  sleepy: '#9E9E9E',
  sad: Colors.error,
};

export default function ChesterAvatar({ chester, size = 'medium', showInfo = true }: Props) {
  const dimensions = { small: 80, medium: 140, large: 200 }[size];
  const imageSize = { small: 64, medium: 120, large: 176 }[size];

  const stage = getChesterLifeStage(chester.level);
  const stageInfo = LIFE_STAGE_INFO[stage];

  // Equipped cosmetics
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  useEffect(() => {
    getEquippedItems().then(setEquipped).catch(() => {});
  }, [chester]); // re-fetch when chester state changes

  const equippedHat = equipped.hat ? getShopItemById(equipped.hat) : null;
  const equippedAccessory = equipped.accessory ? getShopItemById(equipped.accessory) : null;
  const equippedBg = equipped.background ? getShopItemById(equipped.background) : null;
  const equippedTitle = equipped.title ? getShopItemById(equipped.title) : null;
  const bgColors = equippedBg ? BACKGROUND_COLORS[equippedBg.id] : null;

  // Gentle breathing animation
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Breathing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Excited bounce
    if (chester.mood === 'excited') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -8, duration: 300, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(0);
    }
  }, [chester.mood]);

  // Custom background color from shop
  const containerBg = bgColors ? bgColors[0] + '30' : '#FFF8F0';

  // Stage-based border and glow
  const borderColor = stage === 'golden' ? '#FFD700' : stage === 'champion' ? '#FFD700' : Colors.primary;
  const borderWidth = stage === 'golden' ? 4 : stage === 'champion' ? 3 : 2;
  const glowColor = stage === 'golden' ? 'rgba(255, 215, 0, 0.35)' : stage === 'champion' ? 'rgba(255, 215, 0, 0.2)' : 'transparent';

  // Mood-based image opacity (sad/sleepy Chester is slightly dimmed)
  const imageOpacity = chester.mood === 'sad' ? 0.7 : chester.mood === 'sleepy' ? 0.8 : 1;

  return (
    <View style={styles.container} accessibilityLabel={`Chester the dog, level ${chester.level} ${stageInfo.name}, mood ${MOOD_LABELS[chester.mood]}, health ${chester.health} percent`} accessibilityRole="image">
      {/* Golden aura for champion/golden stages */}
      {(stage === 'golden' || stage === 'champion') && (
        <View style={[styles.aura, {
          width: dimensions + 28,
          height: dimensions + 28,
          borderRadius: (dimensions + 28) / 2,
          backgroundColor: glowColor,
        }]} />
      )}

      <Animated.View style={{
        transform: [
          { scale: breatheAnim },
          { translateY: bounceAnim },
        ],
      }}>
        {/* Dog image container */}
        <View style={[styles.imageContainer, {
          width: dimensions,
          height: dimensions,
          borderRadius: dimensions / 2,
          borderColor,
          borderWidth,
          backgroundColor: containerBg,
        }]}>
          <Image
            source={CHESTER_IMAGE}
            style={[styles.chesterImage, {
              width: imageSize,
              height: imageSize,
              opacity: imageOpacity,
            }]}
            resizeMode="cover"
            accessibilityLabel="Chester the dog"
          />

          {/* Sleepy overlay */}
          {chester.mood === 'sleepy' && (
            <View style={styles.sleepyOverlay}>
              <Text style={styles.sleepyEmoji}>💤</Text>
            </View>
          )}

          {/* Hungry indicator */}
          {chester.mood === 'hungry' && size !== 'small' && (
            <View style={styles.hungryBadge}>
              <Text style={styles.hungryEmoji}>🍖</Text>
            </View>
          )}

          {/* Crown for golden Chester (only if no shop hat equipped) */}
          {stage === 'golden' && !equippedHat && (
            <View style={styles.crownContainer}>
              <Text style={[styles.crown, { fontSize: size === 'small' ? 16 : size === 'medium' ? 22 : 28 }]}>👑</Text>
            </View>
          )}

          {/* Medal for champion (only if no shop accessory equipped) */}
          {stage === 'champion' && !equippedAccessory && (
            <View style={styles.medalContainer}>
              <Text style={[styles.medal, { fontSize: size === 'small' ? 14 : size === 'medium' ? 18 : 22 }]}>🏅</Text>
            </View>
          )}

          {/* Shop hat overlay */}
          {equippedHat && (
            <View style={styles.crownContainer}>
              <Text style={{ fontSize: size === 'small' ? 16 : size === 'medium' ? 24 : 32, textAlign: 'center' }}>
                {equippedHat.icon}
              </Text>
            </View>
          )}

          {/* Shop accessory overlay */}
          {equippedAccessory && (
            <View style={styles.accessoryContainer}>
              <Text style={{ fontSize: size === 'small' ? 14 : size === 'medium' ? 20 : 26, textAlign: 'center' }}>
                {equippedAccessory.icon}
              </Text>
            </View>
          )}
        </View>

        {/* Mood indicator dot */}
        {size !== 'small' && (
          <View style={[styles.moodDot, { backgroundColor: MOOD_COLORS[chester.mood] }]} />
        )}
      </Animated.View>

      {showInfo && (
        <View style={styles.info}>
          <Text style={styles.name}>Chester</Text>
          {equippedTitle && (
            <Text style={styles.titleBadge}>{equippedTitle.icon} {equippedTitle.name}</Text>
          )}
          <Text style={[styles.stageBadge, { color: stageInfo.color }]}>{stageInfo.name}</Text>
          <Text style={[styles.mood, { color: MOOD_COLORS[chester.mood] }]}>{MOOD_LABELS[chester.mood]}</Text>

          {/* Health bar */}
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>❤️</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, {
                width: `${chester.health}%`,
                backgroundColor: chester.health > 60 ? Colors.success : chester.health > 30 ? Colors.warning : Colors.error,
              }]} />
            </View>
            <Text style={styles.healthValue}>{chester.health}</Text>
          </View>

          {/* XP and level */}
          <View style={styles.levelRow}>
            <Text style={styles.level}>Lv.{chester.level}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${Math.min((chester.xp / (chester.level * 100)) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.xpText}>{chester.xp}/{chester.level * 100}</Text>
          </View>

          {chester.streak > 0 && (
            <View style={styles.streakRow}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streak}>
                {chester.streak} day streak
                {chester.streak >= 7 ? ` (${getStreakMultiplier(chester.streak)}x XP)` : ''}
              </Text>
            </View>
          )}

          {/* Coins display */}
          {chester.coins > 0 && (
            <View style={styles.coinsRow}>
              <Text style={styles.coinsIcon}>🪙</Text>
              <Text style={styles.coinsText}>{chester.coins} coins</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 60) return 5;
  if (streak >= 30) return 3;
  if (streak >= 7) return 2;
  return 1;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  aura: {
    position: 'absolute',
    top: -14,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFF8F0',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  chesterImage: {
    borderRadius: 999,
  },
  sleepyOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  sleepyEmoji: {
    fontSize: 20,
  },
  hungryBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 2,
  },
  hungryEmoji: {
    fontSize: 16,
  },
  crownContainer: {
    position: 'absolute',
    top: -6,
    alignItems: 'center',
  },
  crown: {
    textAlign: 'center',
  },
  medalContainer: {
    position: 'absolute',
    bottom: -2,
    alignItems: 'center',
  },
  medal: {
    textAlign: 'center',
  },
  moodDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  info: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  stageBadge: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  mood: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  healthLabel: {
    fontSize: 12,
  },
  healthBar: {
    width: 80,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  healthValue: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 6,
  },
  level: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  xpBar: {
    width: 70,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  xpText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  streakFire: {
    fontSize: 14,
  },
  streak: {
    fontSize: FontSize.xs,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  coinsIcon: {
    fontSize: 14,
  },
  coinsText: {
    fontSize: FontSize.xs,
    color: '#B8860B',
    fontWeight: '600',
  },
  accessoryContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 2,
  },
  titleBadge: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
});
