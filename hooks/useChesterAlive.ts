import { useEffect } from 'react';
import {
  Easing,
  SharedValue,
  cancelAnimation,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import type { ChesterState } from '../types';

// ─── Chester "Alive" Animation Hook ──────────────────────────────────────────
//
// Produces SharedValues for the breathing, idle micro-pulse, tap-wiggle, and
// parallax tilt layers that make a static Chester PNG feel alive. The values
// are intentionally separate so callers can compose them into a single
// transform with multiplicative scale and additive rotation/translate.
//
// Composition rule (caller side):
//   scale     = breathScale * idleScale * tapScale
//   rotate    = wiggleRotate + tiltX  (degrees, additive)
//   translateY = breathLift + tiltY
//
// All values are 60fps Reanimated; nothing animates on the JS thread.

export interface ChesterAliveValues {
  /** Smooth breathing scale (1.00 ↔ 1.04). Always running unless paused. */
  breathScale: SharedValue<number>;
  /** Tiny vertical lift paired with the breath, so Chester rises with each inhale. */
  breathLift: SharedValue<number>;
  /** Idle micro-pulse layered over breathing, fires every 6-9s. */
  idleScale: SharedValue<number>;
  /** Tap-triggered scale punch (1 → 1.08 → 1). Driver: trigger() below. */
  tapScale: SharedValue<number>;
  /** Tap-triggered wiggle rotation (deg). Companion to tapScale. */
  wiggleRotate: SharedValue<number>;
  /** Parallax horizontal shift in deg (driven by external pan/touch). */
  tiltX: SharedValue<number>;
  /** Parallax vertical lift in px (driven by external pan/touch). */
  tiltY: SharedValue<number>;
  /** Trigger a tap-wiggle. Idempotent if called mid-wiggle. */
  triggerTap: () => void;
  /** Update parallax tilt from a normalised input (-1..1 each axis). */
  setTilt: (xNorm: number, yNorm: number) => void;
  /** Reset parallax tilt back to neutral with a spring. */
  resetTilt: () => void;
}

interface Options {
  mood: ChesterState['mood'];
  /** Disable everything (e.g. while a screen is suspended). */
  enabled?: boolean;
}

export function useChesterAlive({ mood, enabled = true }: Options): ChesterAliveValues {
  const breathScale  = useSharedValue(1);
  const breathLift   = useSharedValue(0);
  const idleScale    = useSharedValue(1);
  const tapScale     = useSharedValue(1);
  const wiggleRotate = useSharedValue(0);
  const tiltX        = useSharedValue(0);
  const tiltY        = useSharedValue(0);

  // ── Breathing loop. Sleepy is slower & deeper; excited is faster & shallower. ──
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(breathScale);
      cancelAnimation(breathLift);
      breathScale.value = 1;
      breathLift.value = 0;
      return;
    }

    const period =
      mood === 'sleepy'  ? 3200 :
      mood === 'excited' ? 1300 :
      mood === 'sad'     ? 2800 :
      2200;
    const peakScale =
      mood === 'sleepy'  ? 1.05 :
      mood === 'excited' ? 1.02 :
      1.035;
    const peakLift =
      mood === 'sleepy'  ? -2 :
      mood === 'excited' ? -1 :
      -1.5;

    breathScale.value = withRepeat(
      withSequence(
        withTiming(peakScale, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(1,         { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    breathLift.value = withRepeat(
      withSequence(
        withTiming(peakLift, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,        { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(breathScale);
      cancelAnimation(breathLift);
    };
  }, [mood, enabled, breathScale, breathLift]);

  // ── Idle micro-pulse: brief 1.02x bump every 6–9s, random feel ──
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(idleScale);
      idleScale.value = 1;
      return;
    }

    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      const delay = 6000 + Math.random() * 3000;
      idleScale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.02, { duration: 220, easing: Easing.out(Easing.quad) }),
          withTiming(1,    { duration: 320, easing: Easing.in(Easing.quad) }, () => {
            // Schedule the next pulse on JS by setting a sentinel value
            // (callbacks here run on UI thread, so we use scheduleOnJS pattern
            // via a setTimeout outside the animation chain)
          }),
        ),
      );
      // Loop on JS — simpler than runOnJS dance for a 6–9s cadence
      setTimeout(schedule, delay + 600);
    };
    schedule();

    return () => { cancelled = true; cancelAnimation(idleScale); };
  }, [enabled, idleScale]);

  // ── Tap-wiggle trigger ──
  const triggerTap = () => {
    tapScale.value = withSequence(
      withTiming(1.08, { duration: 120, easing: Easing.out(Easing.back(2)) }),
      withSpring(1, { damping: 8, stiffness: 180 }),
    );
    wiggleRotate.value = withSequence(
      withTiming(-6, { duration: 90 }),
      withTiming(6,  { duration: 110 }),
      withTiming(-3, { duration: 90 }),
      withTiming(0,  { duration: 120 }),
    );
  };

  // ── Parallax tilt from pan/pointer ──
  const setTilt = (xNorm: number, yNorm: number) => {
    const clamped = (v: number) => Math.max(-1, Math.min(1, v));
    tiltX.value = withTiming(clamped(xNorm) * 6, { duration: 80 });
    tiltY.value = withTiming(clamped(yNorm) * 4, { duration: 80 });
  };

  const resetTilt = () => {
    tiltX.value = withSpring(0, { damping: 10, stiffness: 120 });
    tiltY.value = withSpring(0, { damping: 10, stiffness: 120 });
  };

  return {
    breathScale,
    breathLift,
    idleScale,
    tapScale,
    wiggleRotate,
    tiltX,
    tiltY,
    triggerTap,
    setTilt,
    resetTilt,
  };
}
