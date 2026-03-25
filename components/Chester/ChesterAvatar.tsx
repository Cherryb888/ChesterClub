import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { ChesterState, ChesterLifeStage } from '../../types';
import { getChesterLifeStage, LIFE_STAGE_INFO, getShopItem } from '../../services/storage';

interface Props {
  chester: ChesterState;
  size?: 'small' | 'medium' | 'large';
  showInfo?: boolean;
}

const MOOD_FACES: Record<ChesterState['mood'], string> = {
  happy: '(^.^)',
  excited: '(^o^)',
  neutral: '(-.-)',
  hungry: '(o.o)',
  sleepy: '(u.u)',
  sad: '(T.T)',
};

const MOOD_LABELS: Record<ChesterState['mood'], string> = {
  happy: 'Happy',
  excited: 'Excited!',
  neutral: 'Chillin',
  hungry: 'Hungry...',
  sleepy: 'Sleepy',
  sad: 'Needs you...',
};

export default function ChesterAvatar({ chester, size = 'medium', showInfo = true }: Props) {
  const dimensions = { small: 80, medium: 140, large: 200 }[size];
  const fontSize = { small: 24, medium: 40, large: 56 }[size];
  const earSize = { small: 16, medium: 28, large: 36 }[size];

  const stage = getChesterLifeStage(chester.level);
  const stageInfo = LIFE_STAGE_INFO[stage];

  // Border color changes with life stage
  const borderColor = stage === 'golden' ? '#FFD700' : stage === 'champion' ? '#FFD700' : Colors.primary;
  // Golden aura for max stage
  const glowColor = stage === 'golden' ? 'rgba(255, 215, 0, 0.4)' : stage === 'champion' ? 'rgba(255, 215, 0, 0.2)' : 'transparent';

  // Health affects ear droop for sad chester
  const earDroop = chester.mood === 'sad' || chester.mood === 'hungry';

  return (
    <View style={styles.container}>
      {/* Golden aura for champion/golden stages */}
      {(stage === 'golden' || stage === 'champion') && (
        <View style={[styles.aura, { width: dimensions + 24, height: dimensions + 24, backgroundColor: glowColor }]} />
      )}

      {/* Dog body */}
      <View style={[styles.dogBody, { width: dimensions, height: dimensions }]}>
        {/* Ears */}
        <View style={[
          styles.ear,
          styles.leftEar,
          { width: earSize, height: earSize * 1.5, left: dimensions * 0.1 },
          earDroop && { transform: [{ rotate: '-40deg' }], top: 5 },
        ]} />
        <View style={[
          styles.ear,
          styles.rightEar,
          { width: earSize, height: earSize * 1.5, right: dimensions * 0.1 },
          earDroop && { transform: [{ rotate: '40deg' }], top: 5 },
        ]} />

        {/* Face */}
        <View style={[styles.face, {
          width: dimensions * 0.85,
          height: dimensions * 0.85,
          borderColor,
          borderWidth: stage === 'golden' ? 4 : 3,
        }]}>
          <Text style={[styles.faceText, { fontSize }]}>
            {stageInfo.emoji.split(/\s/)[stage === 'champion' || stage === 'golden' ? 1 : 0] || stageInfo.emoji}
          </Text>
          {/* Crown for golden chester */}
          {stage === 'golden' && size !== 'small' && (
            <Text style={styles.crown}>👑</Text>
          )}
          {/* Medal for champion */}
          {stage === 'champion' && size !== 'small' && (
            <Text style={styles.medal}>🏅</Text>
          )}
          {/* Equipped outfit */}
          {chester.equippedOutfit && size !== 'small' && (
            <Text style={[styles.equippedOutfit, { fontSize: dimensions * 0.2 }]}>
              {getShopItem(chester.equippedOutfit)?.emoji}
            </Text>
          )}
          {/* Equipped accessory */}
          {chester.equippedAccessory && size !== 'small' && (
            <Text style={[styles.equippedAccessory, { fontSize: dimensions * 0.18 }]}>
              {getShopItem(chester.equippedAccessory)?.emoji}
            </Text>
          )}
        </View>
      </View>

      {showInfo && (
        <View style={styles.info}>
          <Text style={styles.name}>Chester</Text>
          <Text style={[styles.stageBadge, { color: stageInfo.color }]}>{stageInfo.name}</Text>
          <Text style={styles.mood}>{MOOD_LABELS[chester.mood]}</Text>

          {/* Health bar */}
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>❤️</Text>
            <View style={styles.healthBar}>
              <View style={[styles.healthFill, {
                width: `${chester.health}%`,
                backgroundColor: chester.health > 60 ? Colors.success : chester.health > 30 ? Colors.warning : Colors.error,
              }]} />
            </View>
          </View>

          {/* XP and level */}
          <View style={styles.levelRow}>
            <Text style={styles.level}>Lv.{chester.level}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${(chester.xp / (chester.level * 100)) * 100}%` }]} />
            </View>
          </View>
          {chester.streak > 0 && (
            <Text style={styles.streak}>
              {chester.streak} day streak! 🔥
              {chester.streak >= 7 ? ` (${getStreakMultiplier(chester.streak)}x XP)` : ''}
            </Text>
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
    borderRadius: 999,
    top: -12,
  },
  dogBody: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ear: {
    position: 'absolute',
    top: -5,
    backgroundColor: '#D2691E',
    borderRadius: 12,
    transform: [{ rotate: '-15deg' }],
  },
  leftEar: {
    transform: [{ rotate: '-20deg' }],
  },
  rightEar: {
    transform: [{ rotate: '20deg' }],
  },
  face: {
    backgroundColor: '#FFF3E0',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  faceText: {
    textAlign: 'center',
  },
  crown: {
    position: 'absolute',
    top: -20,
    fontSize: 24,
  },
  medal: {
    position: 'absolute',
    bottom: -8,
    fontSize: 20,
  },
  equippedOutfit: {
    position: 'absolute',
    bottom: -12,
    left: -8,
  },
  equippedAccessory: {
    position: 'absolute',
    top: -14,
    left: -6,
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
    color: Colors.textSecondary,
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
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  level: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  xpBar: {
    width: 80,
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
  streak: {
    fontSize: FontSize.xs,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});
