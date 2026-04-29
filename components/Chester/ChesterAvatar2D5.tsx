// components/Chester/ChesterAvatar2D5.tsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import type { ChesterState } from '../../types';

// Frames (reuse the Rive-prep PNGs you already have)
const CHESTER = {
  idle: require('../../assets/chester/rive/chester-idle.png'),
  bending: require('../../assets/chester/rive/chester-bending-down.png'),
  digging: require('../../assets/chester/rive/chester-digging.png'),
  buried: require('../../assets/chester/rive/chester-buried.png'),
  found: require('../../assets/chester/rive/chester-found-bone.png'),
};

// Imperative API mirroring rive-react-native's RiveRef.
// useChesterAnimations can drive either Rive or this component without changes.
export interface Chester2D5Ref {
  fireState: (sm: string, input: string) => void;
  setInputState: (sm: string, input: string, value: boolean) => void;
  reset: () => void;
}

interface Props {
  size?: number;
  /** Optional initial mood for ambient idle variation. */
  mood?: ChesterState['mood'];
}

const SPRING_BOUNCE = { tension: 180, friction: 7, useNativeDriver: true };
const SPRING_SOFT = { tension: 90, friction: 10, useNativeDriver: true };

const ChesterAvatar2D5 = forwardRef<Chester2D5Ref, Props>(
  ({ size = 220, mood = 'neutral' as ChesterState['mood'] }, ref) => {
    // Chester body shared values
    const bodyY = useRef(new Animated.Value(0)).current;
    const bodyScale = useRef(new Animated.Value(1)).current;
    const bodyRot = useRef(new Animated.Value(0)).current;
    const bodySkewX = useRef(new Animated.Value(0)).current;
    // Ground shadow (separate layer)
    const shadowScale = useRef(new Animated.Value(1)).current;
    const shadowOpacity = useRef(new Animated.Value(0.45)).current;
    // Parallax background plane
    const bgY = useRef(new Animated.Value(0)).current;
    const bgScale = useRef(new Animated.Value(1)).current;
    // Mood-driven ambient sway
    const ambient = useRef(new Animated.Value(0)).current;
    // Sparkle layer
    const sparkleOp = useRef(new Animated.Value(0)).current;
    const sparkleY = useRef(new Animated.Value(0)).current;
    // Frame swap for dig sequence
    const [frame, setFrame] = useState<keyof typeof CHESTER>('idle');
    const digTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // Idle bob — always running, intensity tied to mood
    useEffect(() => {
      const intensity =
        mood === 'sleepy' ? 0.4 :
        mood === 'excited' ? 1.4 :
        mood === 'sad' || mood === 'hungry' ? 0.7 : 1;

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ambient, {
            toValue: 1,
            duration: 1400 / intensity,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ambient, {
            toValue: 0,
            duration: 1400 / intensity,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [mood, ambient]);

    // Reusable animation primitives
    const pop = (peak = 1.12, dur = 180) =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bodyScale, { toValue: peak, duration: dur, useNativeDriver: true }),
          Animated.timing(shadowScale, { toValue: 0.7, duration: dur, useNativeDriver: true }),
          Animated.timing(shadowOpacity, { toValue: 0.25, duration: dur, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(bodyScale, { toValue: 1, ...SPRING_BOUNCE }),
          Animated.spring(shadowScale, { toValue: 1, ...SPRING_BOUNCE }),
          Animated.timing(shadowOpacity, { toValue: 0.45, duration: 200, useNativeDriver: true }),
        ]),
      ]);

    const bounce = (height = 26) =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bodyScale, { toValue: 0.94, duration: 100, useNativeDriver: true }),
          Animated.timing(shadowScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(bodyY, { toValue: -height, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(bodyScale, { toValue: 1.06, duration: 220, useNativeDriver: true }),
          Animated.timing(shadowScale, { toValue: 0.6, duration: 220, useNativeDriver: true }),
          Animated.timing(shadowOpacity, { toValue: 0.2, duration: 220, useNativeDriver: true }),
          Animated.timing(bgY, { toValue: 4, duration: 220, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(bodyY, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(bodyScale, { toValue: 1.04, duration: 180, useNativeDriver: true }),
          Animated.timing(shadowScale, { toValue: 1.15, duration: 180, useNativeDriver: true }),
          Animated.timing(shadowOpacity, { toValue: 0.55, duration: 180, useNativeDriver: true }),
          Animated.timing(bgY, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(bodyScale, { toValue: 1, ...SPRING_BOUNCE }),
          Animated.spring(shadowScale, { toValue: 1, ...SPRING_BOUNCE }),
          Animated.timing(shadowOpacity, { toValue: 0.45, duration: 200, useNativeDriver: true }),
        ]),
      ]);

    const wiggle = (amp = 1) =>
      Animated.sequence([
        Animated.timing(bodyRot, { toValue: amp, duration: 90, useNativeDriver: true }),
        Animated.timing(bodyRot, { toValue: -amp, duration: 120, useNativeDriver: true }),
        Animated.timing(bodyRot, { toValue: amp * 0.6, duration: 100, useNativeDriver: true }),
        Animated.spring(bodyRot, { toValue: 0, ...SPRING_SOFT }),
      ]);

    const sparkleBurst = () =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(sparkleOp, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(sparkleY, { toValue: -28, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(sparkleOp, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]);

    const reset = () => {
      digTimer.current && clearInterval(digTimer.current);
      bodyY.setValue(0); bodyScale.setValue(1); bodyRot.setValue(0); bodySkewX.setValue(0);
      shadowScale.setValue(1); shadowOpacity.setValue(0.45);
      bgY.setValue(0); bgScale.setValue(1);
      sparkleOp.setValue(0); sparkleY.setValue(0);
      setFrame('idle');
    };

    // Per-trigger choreography (matches state-machine input names)
    const fireMap: Record<string, () => void> = {
      onFoodLogged: () => Animated.sequence([bounce(22), wiggle(0.5)]).start(),
      onMealScanned: () => {
        Animated.sequence([
          wiggle(0.8),
          Animated.timing(bodySkewX, { toValue: 0.08, duration: 120, useNativeDriver: true }),
          Animated.timing(bodySkewX, { toValue: -0.08, duration: 140, useNativeDriver: true }),
          Animated.spring(bodySkewX, { toValue: 0, ...SPRING_SOFT }),
        ]).start();
      },
      onWaterLogged: () => {
        Animated.sequence([
          Animated.timing(bodyRot, { toValue: -0.8, duration: 220, useNativeDriver: true }),
          Animated.timing(bodyScale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
          Animated.spring(bodyRot, { toValue: 0, ...SPRING_BOUNCE }),
          Animated.spring(bodyScale, { toValue: 1, ...SPRING_BOUNCE }),
        ]).start();
      },
      onLevelUp: () => {
        Animated.parallel([bounce(50), sparkleBurst()]).start();
      },
      onStreakMilestone: () => {
        Animated.parallel([
          Animated.sequence([bounce(18), bounce(18)]),
          sparkleBurst(),
        ]).start();
      },
      onAchievement: () => {
        Animated.parallel([pop(1.18, 220), wiggle(1.0), sparkleBurst()]).start();
      },
      onDigStart: () => {
        setFrame('bending');
        let i = 0;
        const seq: (keyof typeof CHESTER)[] = ['bending', 'digging', 'buried', 'digging', 'buried', 'digging'];
        digTimer.current && clearInterval(digTimer.current);
        digTimer.current = setInterval(() => {
          setFrame(seq[i % seq.length]);
          i++;
          if (i >= seq.length) digTimer.current && clearInterval(digTimer.current);
        }, 320);
        Animated.loop(
          Animated.sequence([
            Animated.timing(bodyRot, { toValue: 0.4, duration: 160, useNativeDriver: true }),
            Animated.timing(bodyRot, { toValue: -0.4, duration: 160, useNativeDriver: true }),
          ]),
          { iterations: 5 },
        ).start();
      },
      onDigDeep: () => {
        setFrame('buried');
        Animated.timing(bodyY, { toValue: 6, duration: 200, useNativeDriver: true }).start();
      },
      onDigReveal: () => {
        digTimer.current && clearInterval(digTimer.current);
        setFrame('found');
        Animated.parallel([pop(1.2, 200), sparkleBurst()]).start();
        Animated.spring(bodyY, { toValue: 0, ...SPRING_BOUNCE }).start();
      },
      onToyPlay: () => {
        Animated.sequence([wiggle(0.7), bounce(14), wiggle(0.5)]).start();
      },
    };

    useImperativeHandle(ref, () => ({
      fireState: (_sm, input) => fireMap[input]?.(),
      setInputState: (_sm, input, value) => {
        if (!value) return;
        if (input === 'isSleeping') {
          Animated.sequence([
            Animated.timing(bodyScale, { toValue: 1.05, duration: 600, useNativeDriver: true }),
            Animated.spring(bodyScale, { toValue: 1, ...SPRING_SOFT }),
          ]).start();
        }
        if (input === 'isHungry') {
          Animated.loop(wiggle(0.4), { iterations: 2 }).start();
        }
        if (input === 'isExcited') fireMap.onFoodLogged();
      },
      reset,
    }), []);

    // Derived transforms
    const ambientY = ambient.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
    const ambientRot = ambient.interpolate({ inputRange: [0, 1], outputRange: ['-1deg', '1deg'] });
    const rotDeg = bodyRot.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
    const skewDeg = bodySkewX.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });

    return (
      <View style={[styles.root, { width: size, height: size }]}>
        {/* Layer 1 — parallax background plane */}
        <Animated.View
          style={[
            styles.bg,
            {
              transform: [
                { translateY: bgY },
                { scale: bgScale },
              ],
            },
          ]}
        >
          <View style={[styles.bgInner, { width: size * 1.1, height: size * 0.6 }]} />
        </Animated.View>

        {/* Layer 2 — ground shadow */}
        <Animated.View
          style={[
            styles.shadow,
            {
              width: size * 0.55,
              height: size * 0.12,
              opacity: shadowOpacity,
              transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }],
            },
          ]}
        />

        {/* Layer 3 — Chester body with stacked transforms */}
        <Animated.View
          style={{
            transform: [
              { perspective: 800 },
              { translateY: Animated.add(bodyY, ambientY) },
              { scale: bodyScale },
              { rotate: rotDeg },
              { rotateZ: ambientRot },
              { skewX: skewDeg },
            ],
          }}
        >
          <Image
            source={CHESTER[frame]}
            style={{ width: size, height: size * 0.75 }}
            resizeMode="contain"
            accessibilityLabel="Chester"
          />
        </Animated.View>

        {/* Layer 4 — sparkle overlay */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sparkleLayer,
            { opacity: sparkleOp, transform: [{ translateY: sparkleY }] },
          ]}
        >
          <Animated.Text style={[styles.sparkle, { left: '20%' }]}>{'✨'}</Animated.Text>
          <Animated.Text style={[styles.sparkle, { left: '50%' }]}>{'⭐'}</Animated.Text>
          <Animated.Text style={[styles.sparkle, { left: '75%' }]}>{'✨'}</Animated.Text>
        </Animated.View>
      </View>
    );
  },
);

export default ChesterAvatar2D5;

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  bg: {
    position: 'absolute',
    bottom: '8%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgInner: {
    backgroundColor: 'rgba(120, 160, 200, 0.18)',
    borderRadius: 999,
  },
  shadow: {
    position: 'absolute',
    bottom: '6%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
  },
  sparkleLayer: {
    position: 'absolute',
    top: '5%',
    width: '100%',
    height: '40%',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 18,
  },
});
