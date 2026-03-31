import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

interface Props {
  message: string;
  score?: 'great' | 'good' | 'okay' | 'poor';
  visible: boolean;
  autoDismissMs?: number;
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

export default function ChesterReaction({ message, score, visible, autoDismissMs = 6000 }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [showing, setShowing] = useState(visible);

  useEffect(() => {
    if (visible && message) {
      setShowing(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]).start();

      // Auto-dismiss
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
          setShowing(false);
        });
      }, autoDismissMs);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(10);
      scaleAnim.setValue(0.9);
      setShowing(false);
    }
  }, [visible, message]);

  if (!showing || !message) return null;

  const accentColor = score ? SCORE_COLORS[score] : Colors.primary;

  return (
    <Animated.View style={[
      styles.bubble,
      {
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
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
      {/* Tail pointing left toward Chester */}
      <View style={styles.tailLeft} />
      <View style={styles.tailLeftCover} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    maxWidth: 220,
    flexShrink: 1,
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
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  // Tail pointing left
  tailLeft: {
    position: 'absolute',
    left: -8,
    top: '40%',
    width: 14,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 0,
    borderRightWidth: 0,
    transform: [{ rotate: '45deg' }],
  },
  tailLeftCover: {
    position: 'absolute',
    left: -1,
    top: '40%',
    width: 4,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
});
