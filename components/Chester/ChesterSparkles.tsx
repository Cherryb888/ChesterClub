import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { ChesterState } from '../../types';

interface Props {
  mood: ChesterState['mood'];
  containerSize: number;
}

/**
 * Floating sparkle dots that radiate from Chester when he's excited or
 * has just received a great reaction. Pure Animated views, no Skia.
 *
 * Each sparkle follows its own staggered loop: fade in, drift up + outward,
 * fade out, repeat. Six sparkles around the silhouette gives the impression
 * of energy without being noisy.
 */
export default function ChesterSparkles({ mood, containerSize }: Props) {
  const visible = mood === 'excited' || mood === 'happy';

  const sparkles = React.useMemo(
    () => [
      { angle: -90, distance: 0.55, delay: 0,    color: '#FFD700' },
      { angle: -45, distance: 0.50, delay: 250,  color: '#FF8C42' },
      { angle:   0, distance: 0.55, delay: 500,  color: '#FFD700' },
      { angle:  45, distance: 0.48, delay: 750,  color: '#FFB347' },
      { angle: -135, distance: 0.50, delay: 1000, color: '#FFD700' },
      { angle:  135, distance: 0.48, delay: 1250, color: '#FF8C42' },
    ],
    [],
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {sparkles.map((s, i) => (
        <Sparkle
          key={i}
          containerSize={containerSize}
          angleDeg={s.angle}
          distanceFrac={s.distance}
          delay={s.delay}
          color={s.color}
          intense={mood === 'excited'}
        />
      ))}
    </View>
  );
}

function Sparkle({
  containerSize,
  angleDeg,
  distanceFrac,
  delay,
  color,
  intense,
}: {
  containerSize: number;
  angleDeg: number;
  distanceFrac: number;
  delay: number;
  color: string;
  intense: boolean;
}) {
  const opacity = useSharedValue(0);
  const drift   = useSharedValue(0);

  useEffect(() => {
    const period = intense ? 1400 : 2000;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: period * 0.3, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: period * 0.7, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    drift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: period, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(drift);
    };
  }, [delay, intense, opacity, drift]);

  const radians = (angleDeg * Math.PI) / 180;
  const baseRadius = (containerSize / 2) * distanceFrac;
  const baseX = Math.cos(radians) * baseRadius;
  const baseY = Math.sin(radians) * baseRadius;

  const animatedStyle = useAnimatedStyle(() => {
    const driftPx = drift.value * 14;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: baseX + Math.cos(radians) * driftPx },
        { translateY: baseY + Math.sin(radians) * driftPx - drift.value * 6 },
        { scale: 0.6 + opacity.value * 0.6 },
      ],
    };
  });

  const size = intense ? 10 : 7;

  return (
    <Animated.View
      style={[
        styles.sparkleHost,
        {
          width: size,
          height: size,
          marginLeft: containerSize / 2 - size / 2,
          marginTop: containerSize / 2 - size / 2,
          backgroundColor: color,
          borderRadius: size / 2,
          shadowColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  sparkleHost: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
});
