import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

// ─── 4 dig frames ───
const DIG_FRAMES = [
  require('../../assets/chester/chester-dig-idle.png'),  // 0: Ready to dig
  require('../../assets/chester/chester-dig-down.png'),  // 1: Paws digging
  require('../../assets/chester/chester-dig-deep.png'),  // 2: Head down in hole
  require('../../assets/chester/chester-dig-pull.png'),  // 3: Pulling bone out (reveal)
];

interface Props {
  /** 'idle' | 'digging' | 'reveal' */
  phase: 'idle' | 'digging' | 'reveal';
  size?: number;
}

export default function ChesterDigAnimation({ phase, size = 220 }: Props) {
  const [frameIndex, setFrameIndex] = useState(0);
  const dirtOpacity = useRef(new Animated.Value(0)).current;
  const dirtY1 = useRef(new Animated.Value(0)).current;
  const dirtY2 = useRef(new Animated.Value(0)).current;
  const revealScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'digging') {
      setFrameIndex(0);

      // Frame sequence: idle → down → deep → down → deep → down → deep → pull
      const frameSequence = [0, 1, 2, 1, 2, 1, 2, 3];
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i < frameSequence.length) {
          setFrameIndex(frameSequence[i]);
        } else {
          clearInterval(interval);
        }
      }, 350);

      // Show dirt flying
      Animated.timing(dirtOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

      // Animate dirt particles bouncing
      Animated.loop(
        Animated.sequence([
          Animated.timing(dirtY1, { toValue: -20, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dirtY1, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        { iterations: 8 },
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(dirtY2, { toValue: -15, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dirtY2, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        { iterations: 6 },
      ).start();

      return () => clearInterval(interval);

    } else if (phase === 'reveal') {
      setFrameIndex(3); // Pull frame — Chester with bone
      Animated.timing(dirtOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      // Triumphant pop
      Animated.sequence([
        Animated.timing(revealScale, { toValue: 1.1, duration: 200, useNativeDriver: true }),
        Animated.spring(revealScale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
      ]).start();

    } else {
      // Idle
      setFrameIndex(0);
      dirtOpacity.setValue(0);
      dirtY1.setValue(0);
      dirtY2.setValue(0);
      revealScale.setValue(1);
    }
  }, [phase]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Dirt particles */}
      <Animated.View style={[styles.dirtContainer, { opacity: dirtOpacity }]}>
        <Animated.Text style={[styles.dirt, { left: '20%', transform: [{ translateY: dirtY1 }] }]}>
          🟤
        </Animated.Text>
        <Animated.Text style={[styles.dirt, { right: '25%', transform: [{ translateY: dirtY2 }] }]}>
          🟤
        </Animated.Text>
        <Animated.Text style={[styles.dirt, { left: '40%', transform: [{ translateY: dirtY1 }] }]}>
          💨
        </Animated.Text>
      </Animated.View>

      {/* Chester frame */}
      <Animated.View style={{ transform: [{ scale: revealScale }] }}>
        <Image
          source={DIG_FRAMES[frameIndex]}
          style={{ width: size, height: size * 0.65, borderRadius: 12 }}
          resizeMode="contain"
          accessibilityLabel={phase === 'digging' ? 'Chester is digging' : phase === 'reveal' ? 'Chester found something' : 'Chester ready to dig'}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  dirtContainer: {
    position: 'absolute',
    bottom: '25%',
    width: '100%',
    zIndex: 10,
  },
  dirt: {
    position: 'absolute',
    fontSize: 16,
  },
});
