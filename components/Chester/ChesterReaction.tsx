import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

interface Props {
  message: string;
  score?: 'great' | 'good' | 'okay' | 'poor';
  visible: boolean;
}

const SCORE_EMOJI: Record<string, string> = {
  great: '🌟',
  good: '👍',
  okay: '🤔',
  poor: '💪',
};

const SCORE_COLORS: Record<string, string> = {
  great: Colors.success,
  good: Colors.primary,
  okay: Colors.warning,
  poor: Colors.error,
};

export default function ChesterReaction({ message, score, visible }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  if (!visible || !message) return null;

  const accentColor = score ? SCORE_COLORS[score] : Colors.primary;

  return (
    <Animated.View style={[
      styles.bubble,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        borderLeftColor: accentColor,
      },
    ]}>
      {score && (
        <View style={[styles.scoreBadge, { backgroundColor: accentColor + '15' }]}>
          <Text style={styles.scoreEmoji}>{SCORE_EMOJI[score]}</Text>
          <Text style={[styles.scoreLabel, { color: accentColor }]}>
            {score.charAt(0).toUpperCase() + score.slice(1)}
          </Text>
        </View>
      )}
      <Text style={styles.text}>{message}</Text>
      <View style={[styles.tail, { borderRightColor: Colors.surface }]} />
      <View style={styles.tailBorder} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  scoreEmoji: {
    fontSize: 14,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  text: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    transform: [{ rotate: '45deg' }],
  },
  tailBorder: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 4,
    backgroundColor: Colors.surface,
  },
});
