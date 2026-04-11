import { useRef, useCallback, useEffect } from 'react';
import type { RiveRef } from 'rive-react-native';
import { ChesterState } from '../types';

const SM = 'ChesterStateMachine';

export interface ChesterAnimationTriggers {
  /** Pass this ref to <ChesterAvatar riveRef={riveRef} /> when RIVE_ENABLED = true */
  riveRef: React.RefObject<RiveRef | null>;
  /** Call whenever chester.mood changes to sync Rive boolean inputs */
  syncMood: (mood: ChesterState['mood']) => void;
  // One-shot trigger functions — call these on app events
  triggerHappy: () => void;       // onFoodLogged
  triggerEating: () => void;      // onMealScanned
  triggerDrinking: () => void;    // onWaterLogged
  triggerLevelUp: () => void;     // onLevelUp
  triggerStreak: () => void;      // onStreakMilestone
  triggerAchievement: () => void; // onAchievement
  // Dig screen triggers
  triggerDigStart: () => void;    // onDigStart
  triggerDigDeep: () => void;     // onDigDeep
  triggerDigReveal: () => void;   // onDigReveal
}

/**
 * useChesterAnimations
 *
 * Manages the Rive state machine for Chester's 10 animated states.
 * All inputs must match ChesterStateMachine names in chester.riv exactly.
 *
 * Usage:
 *   const { riveRef, syncMood, triggerHappy } = useChesterAnimations();
 *   // In JSX: <ChesterAvatar riveRef={riveRef} chester={chester} />
 *   // On food log: triggerHappy();
 *   // On mood change: syncMood(chester.mood);
 */
export function useChesterAnimations(): ChesterAnimationTriggers {
  const riveRef = useRef<RiveRef | null>(null);

  const syncMood = useCallback((mood: ChesterState['mood']) => {
    const r = riveRef.current;
    if (!r) return;
    r.setInputState(SM, 'isSleeping', mood === 'sleepy');
    r.setInputState(SM, 'isHungry',  mood === 'hungry' || mood === 'sad');
    r.setInputState(SM, 'isExcited', mood === 'excited');
  }, []);

  const fire = useCallback((inputName: string) => {
    riveRef.current?.fireState(SM, inputName);
  }, []);

  return {
    riveRef,
    syncMood,
    triggerHappy:       () => fire('onFoodLogged'),
    triggerEating:      () => fire('onMealScanned'),
    triggerDrinking:    () => fire('onWaterLogged'),
    triggerLevelUp:     () => fire('onLevelUp'),
    triggerStreak:      () => fire('onStreakMilestone'),
    triggerAchievement: () => fire('onAchievement'),
    triggerDigStart:    () => fire('onDigStart'),
    triggerDigDeep:     () => fire('onDigDeep'),
    triggerDigReveal:   () => fire('onDigReveal'),
  };
}
