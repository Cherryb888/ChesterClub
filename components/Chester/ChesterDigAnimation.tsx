import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

// ─── Frame images ───
// Replace these with proper dig frames when available.
// Expected files in assets/chester/:
//   chester-dig-idle.png
//   chester-dig-down.png
//   chester-dig-deep.png
//   chester-dig-pull.png
//   chester-dig-reveal.png

const CHESTER_FALLBACK = require('../../assets/chester/chester-solo.png');

// Try to load dig frames; fall back to the solo image if they don't exist yet.
let DIG_FRAMES: any[];
try {
  DIG_FRAMES = [
    require('../../assets/chester/chester-dig-idle.png'),
    require('../../assets/chester/chester-dig-down.png'),
    require('../../assets/chester/chester-dig-deep.png'),
    require('../../assets/chester/chester-dig-pull.png'),
    require('../../assets/chester/chester-dig-reveal.png'),
  ];
} catch {
  DIG_FRAMES = [];
}

const HAS_FRAMES = DIG_FRAMES.length === 5;

interface Props {
  /** 'idle' | 'digging' | 'reveal' */
  phase: 'idle' | 'digging' | 'reveal';
  size?: number;
}

export default function ChesterDigAnimation({ phase, size = 200 }: Props) {
  // Shared animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const dirtOpacity = useRef(new Animated.Value(0)).current;
  const revealScale = useRef(new Animated.Value(0.8)).current;

  // Frame-based animation
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (phase === 'digging') {
      if (HAS_FRAMES) {
        // Frame-by-frame animation
        setFrameIndex(0);
        const frameSequence = [0, 1, 2, 1, 2, 1, 2, 3];
        let i = 0;
        const interval = setInterval(() => {
          i++;
          if (i < frameSequence.length) {
            setFrameIndex(frameSequence[i]);
          } else {
            clearInterval(interval);
            setFrameIndex(3); // pull frame
          }
        }, 300);
        // Show dirt
        Animated.timing(dirtOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        return () => clearInterval(interval);
      } else {
        // Fallback: shake + bounce animation using the single image
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: -12, duration: 80, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 12, duration: 80, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 80, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 80, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 80, easing: Easing.linear, useNativeDriver: true }),
          ]),
          { iterations: 5 },
        ).start();

        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: 10, duration: 150, useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: -5, duration: 150, useNativeDriver: true }),
          ]),
          { iterations: 10 },
        ).start();

        Animated.timing(dirtOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }
    } else if (phase === 'reveal') {
      if (HAS_FRAMES) {
        setFrameIndex(4); // reveal frame
      }
      shakeAnim.setValue(0);
      bounceAnim.setValue(0);
      Animated.timing(dirtOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      Animated.spring(revealScale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }).start();
    } else {
      // idle
      if (HAS_FRAMES) {
        setFrameIndex(0);
      }
      shakeAnim.setValue(0);
      bounceAnim.setValue(0);
      dirtOpacity.setValue(0);
      revealScale.setValue(0.8);
    }
  }, [phase]);

  const currentSource = HAS_FRAMES ? DIG_FRAMES[frameIndex] : CHESTER_FALLBACK;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Dirt particles */}
      <Animated.View style={[styles.dirtContainer, { opacity: dirtOpacity }]}>
        <Animated.Text style={[styles.dirt, styles.dirt1, {
          transform: [{ translateY: Animated.multiply(bounceAnim, -1) }],
        }]}>💨</Animated.Text>
        <Animated.Text style={[styles.dirt, styles.dirt2, {
          transform: [{ translateY: bounceAnim }],
        }]}>💨</Animated.Text>
        <Animated.Text style={[styles.dirt, styles.dirt3, {
          transform: [{ translateY: Animated.multiply(bounceAnim, -0.5) }],
        }]}>💨</Animated.Text>
      </Animated.View>

      {/* Chester */}
      <Animated.View style={{
        transform: HAS_FRAMES
          ? [{ scale: phase === 'reveal' ? revealScale : 1 }]
          : [
              { translateX: shakeAnim },
              { translateY: bounceAnim },
              { scale: phase === 'reveal' ? revealScale : 1 },
            ],
      }}>
        <Image
          source={currentSource}
          style={{ width: size * 0.85, height: size * 0.85, borderRadius: size * 0.1 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Ground line */}
      <View style={styles.ground} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  dirtContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  dirt: {
    position: 'absolute',
    fontSize: 24,
  },
  dirt1: { left: '15%', bottom: 0 },
  dirt2: { right: '15%', bottom: 10 },
  dirt3: { left: '45%', bottom: 5 },
  ground: {
    width: '80%',
    height: 4,
    backgroundColor: '#8B6914',
    borderRadius: 2,
    opacity: 0.4,
    marginTop: -2,
  },
});
