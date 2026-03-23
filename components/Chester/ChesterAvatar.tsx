import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { ChesterState } from '../../types';

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
};

const MOOD_LABELS: Record<ChesterState['mood'], string> = {
  happy: 'Happy',
  excited: 'Excited!',
  neutral: 'Chillin',
  hungry: 'Hungry...',
  sleepy: 'Sleepy',
};

export default function ChesterAvatar({ chester, size = 'medium', showInfo = true }: Props) {
  const dimensions = { small: 80, medium: 140, large: 200 }[size];
  const fontSize = { small: 24, medium: 40, large: 56 }[size];
  const earSize = { small: 16, medium: 28, large: 36 }[size];

  return (
    <View style={styles.container}>
      {/* Dog body */}
      <View style={[styles.dogBody, { width: dimensions, height: dimensions }]}>
        {/* Ears */}
        <View style={[styles.ear, styles.leftEar, { width: earSize, height: earSize * 1.5, left: dimensions * 0.1 }]} />
        <View style={[styles.ear, styles.rightEar, { width: earSize, height: earSize * 1.5, right: dimensions * 0.1 }]} />

        {/* Face */}
        <View style={[styles.face, { width: dimensions * 0.85, height: dimensions * 0.85 }]}>
          <Text style={[styles.faceText, { fontSize }]}>
            {chester.mood === 'excited' ? '🐕' : '🐶'}
          </Text>
        </View>
      </View>

      {showInfo && (
        <View style={styles.info}>
          <Text style={styles.name}>Chester</Text>
          <Text style={styles.mood}>{MOOD_LABELS[chester.mood]}</Text>
          <View style={styles.levelRow}>
            <Text style={styles.level}>Lv.{chester.level}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${(chester.xp / (chester.level * 100)) * 100}%` }]} />
            </View>
          </View>
          {chester.streak > 0 && (
            <Text style={styles.streak}>{chester.streak} day streak! 🔥</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
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
  info: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  mood: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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
