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

export default function ChesterReaction({ message, score, visible }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
    }
  }, [visible]);

  if (!visible || !message) return null;

  return (
    <Animated.View style={[styles.bubble, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.text}>
        {score && SCORE_EMOJI[score]} {message}
      </Text>
      <View style={styles.tail} />
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
    textAlign: 'center',
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
});
