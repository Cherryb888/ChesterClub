import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

// ─── Rive feature flag ────────────────────────────────────────────────────────
// Set to true once assets/animations/chester.riv is in place.
const RIVE_ENABLED = false;
// When enabling: uncomment Rive imports at top, set RIVE_ENABLED = true.
// import Rive from 'rive-react-native';
// const CHESTER_RIV = require('../../assets/animations/chester.riv');
// ─────────────────────────────────────────────────────────────────────────────

// ─── 5 dig frames (new Rive artwork) ─────────────────────────────────────────
// 0: idle        — Chester standing ready
// 1: bending     — Bending down, about to dig
// 2: digging     — Active digging pose
// 3: buried      — Head deep in the hole
// 4: found-bone  — Chester triumphantly holding the find
const DIG_FRAMES = [
  require('../../assets/chester/rive/chester-idle.png'),
  require('../../assets/chester/rive/chester-bending-down.png'),
  require('../../assets/chester/rive/chester-digging.png'),
  require('../../assets/chester/rive/chester-buried.png'),
  require('../../assets/chester/rive/chester-found-bone.png'),
];

// Frame sequence for the digging phase:
// idle → bending → digging → buried → digging → buried → digging → found-bone
const DIG_SEQUENCE = [0, 1, 2, 3, 2, 3, 2, 4];

interface Props {
  /** 'idle' | 'digging' | 'reveal' */
  phase: 'idle' | 'digging' | 'reveal';
  size?: number;
}

export default function ChesterDigAnimation({ phase, size = 220 }: Props) {
  const [frameIndex, setFrameIndex] = useState(0);
  const dirtOpacity = useRef(new Animated.Value(0)).current;
  const dirtY1      = useRef(new Animated.Value(0)).current;
  const dirtY2      = useRef(new Animated.Value(0)).current;
  const revealScale = useRef(new Animated.Value(1)).current;

  // ── Rive dig state machine ref (active when RIVE_ENABLED = true) ────────────
  // const riveRef = useRef<RiveRef | null>(null);
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (RIVE_ENABLED) {
      // ── Rive path (uncomment when chester.riv is ready) ───────────────────
      // if (phase === 'digging') riveRef.current?.fireState('ChesterStateMachine', 'onDigStart');
      // if (phase === 'reveal')  riveRef.current?.fireState('ChesterStateMachine', 'onDigReveal');
      // if (phase === 'idle')    riveRef.current?.reset();
      return;
    }

    // ── PNG path ─────────────────────────────────────────────────────────────
    if (phase === 'digging') {
      setFrameIndex(0);

      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i < DIG_SEQUENCE.length) {
          setFrameIndex(DIG_SEQUENCE[i]);
        } else {
          clearInterval(interval);
        }
      }, 350);

      // Fade dirt particles in
      Animated.timing(dirtOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

      // Bounce dirt particles
      Animated.loop(
        Animated.sequence([
          Animated.timing(dirtY1, { toValue: -20, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dirtY1, { toValue:   0, duration: 250, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        ]),
        { iterations: 8 },
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(dirtY2, { toValue: -15, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dirtY2, { toValue:   0, duration: 300, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        ]),
        { iterations: 6 },
      ).start();

      return () => clearInterval(interval);

    } else if (phase === 'reveal') {
      setFrameIndex(4); // Chester Found Bone
      Animated.timing(dirtOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      // Triumphant pop
      Animated.sequence([
        Animated.timing(revealScale, { toValue: 1.12, duration: 200, useNativeDriver: true }),
        Animated.spring(revealScale,  { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
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

      {/* ── Rive component (active when RIVE_ENABLED = true) ──────────────── */}
      {/* {RIVE_ENABLED && (
        <Rive
          ref={riveRef}
          source={CHESTER_RIV}
          artboardName="ChesterArtboard"
          stateMachineName="ChesterStateMachine"
          style={{ width: size, height: size }}
        />
      )} */}

      {/* ── PNG path ────────────────────────────────────────────────────────── */}
      {!RIVE_ENABLED && (
        <>
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
              style={{ width: size, height: size * 0.75, borderRadius: 12 }}
              resizeMode="contain"
              accessibilityLabel={
                phase === 'digging' ? 'Chester is digging'
                : phase === 'reveal' ? 'Chester found something!'
                : 'Chester ready to dig'
              }
            />
          </Animated.View>
        </>
      )}
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
    bottom: '20%',
    width: '100%',
    zIndex: 10,
  },
  dirt: {
    position: 'absolute',
    fontSize: 16,
  },
});
