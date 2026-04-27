import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import ChesterCosmeticOverlay from './Chester/ChesterCosmeticOverlay';
import type { ChesterState as ChesterMoodState } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChesterState =
  | 'idle'
  | 'sleeping'
  | 'excited'
  | 'proud'
  | 'sad'
  | 'dazzled'
  | 'bending'
  | 'buried'
  | 'digging'
  | 'bone';

/**
 * Map widget pose-states to the mood enum used by the cosmetic system so
 * per-mood anchor deltas (sleepy hat tilt, etc.) apply consistently.
 */
const STATE_TO_MOOD: Record<ChesterState, ChesterMoodState['mood']> = {
  idle:     'neutral',
  sleeping: 'sleepy',
  excited:  'excited',
  proud:    'happy',
  sad:      'sad',
  dazzled:  'excited',
  bending:  'neutral',
  buried:   'neutral',
  digging:  'neutral',
  bone:     'happy',
};

interface ChesterWidgetProps {
  state?: ChesterState;
  size?: number;
}

// ─── Image Map ────────────────────────────────────────────────────────────────
// Place your 10 PNGs in assets/chester/ and update these paths if needed.

const IMAGES: Record<ChesterState, ImageSourcePropType> = {
  idle:     require('../assets/chester/idle.png'),
  sleeping: require('../assets/chester/sleeping.png'),
  excited:  require('../assets/chester/excited.png'),
  proud:    require('../assets/chester/proud.png'),
  sad:      require('../assets/chester/sad.png'),
  dazzled:  require('../assets/chester/dazzled.png'),
  bending:  require('../assets/chester/bending.png'),
  buried:   require('../assets/chester/buried.png'),
  digging:  require('../assets/chester/digging.png'),
  bone:     require('../assets/chester/bone.png'),
};

// ─── Animation Config ─────────────────────────────────────────────────────────

type AnimationConfig = {
  duration: number;
  translateY?: { from: number; to: number };
  rotate?: { from: string; to: string };
  scale?: { from: number; to: number };
  easing?: (value: number) => number;
};

const ANIMATION_CONFIG: Record<ChesterState, AnimationConfig> = {
  idle: {
    duration: 3000,
    translateY: { from: 0, to: -8 },
    rotate: { from: '0deg', to: '1deg' },
  },
  sleeping: {
    duration: 3200,
    scale: { from: 1, to: 1.04 },
    translateY: { from: 0, to: -3 },
  },
  excited: {
    duration: 600,
    translateY: { from: 0, to: -20 },
    scale: { from: 1, to: 1.07 },
  },
  proud: {
    duration: 2500,
    rotate: { from: '-2deg', to: '2deg' },
    translateY: { from: 0, to: -4 },
  },
  sad: {
    duration: 2500,
    rotate: { from: '0deg', to: '-4deg' },
    translateY: { from: 0, to: 6 },
  },
  dazzled: {
    duration: 1000,
    scale: { from: 1, to: 1.08 },
    rotate: { from: '-1.5deg', to: '1.5deg' },
  },
  bending: {
    duration: 1200,
    rotate: { from: '-5deg', to: '4deg' },
    translateY: { from: 0, to: -6 },
  },
  buried: {
    duration: 2000,
    translateY: { from: 0, to: -7 },
  },
  digging: {
    duration: 500,
    rotate: { from: '-8deg', to: '6deg' },
    translateY: { from: 0, to: 8 },
  },
  bone: {
    duration: 1500,
    translateY: { from: 0, to: -10 },
    rotate: { from: '-1deg', to: '2deg' },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChesterWidget({
  state = 'idle',
  size = 200,
}: ChesterWidgetProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Stop any running animation cleanly
    animationRef.current?.stop();
    translateY.setValue(0);
    rotate.setValue(0);
    scale.setValue(1);

    const config = ANIMATION_CONFIG[state];
    const animations: Animated.CompositeAnimation[] = [];

    if (config.translateY) {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: config.translateY.to,
              duration: config.duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: config.translateY.from,
              duration: config.duration / 2,
              useNativeDriver: true,
            }),
          ])
        )
      );
    }

    if (config.rotate) {
      const fromVal = parseFloat(config.rotate.from);
      const toVal = parseFloat(config.rotate.to);
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotate, {
              toValue: toVal,
              duration: config.duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: fromVal,
              duration: config.duration / 2,
              useNativeDriver: true,
            }),
          ])
        )
      );
    }

    if (config.scale) {
      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, {
              toValue: config.scale.to,
              duration: config.duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: config.scale.from,
              duration: config.duration / 2,
              useNativeDriver: true,
            }),
          ])
        )
      );
    }

    if (animations.length > 0) {
      animationRef.current = Animated.parallel(animations);
      animationRef.current.start();
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [state]);

  const rotateInterpolated = rotate.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            transform: [
              { translateY },
              { rotate: rotateInterpolated },
              { scale },
            ],
          },
        ]}
      >
        <Image
          source={IMAGES[state]}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
        <ChesterCosmeticOverlay
          containerSize={size}
          mood={STATE_TO_MOOD[state]}
        />
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
