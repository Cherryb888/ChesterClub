import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChesterEvent, subscribeChesterEvents } from '../services/chesterEvents';

// ─── Reaction Types ───────────────────────────────────────────────────────────

export type ReactionScore = 'great' | 'good' | 'okay' | 'poor';

export interface ChesterReactionPayload {
  /** The text shown in the bubble */
  message: string;
  /** Optional score badge */
  score?: ReactionScore;
  /** How long to keep the reaction on screen (default 3500ms) */
  durationMs?: number;
  /** Animation trigger to fire on the (eventual) Rive state machine */
  animation?:
    | 'happy'
    | 'eating'
    | 'drinking'
    | 'levelUp'
    | 'streak'
    | 'achievement'
    | 'digReveal';
}

interface QueuedReaction extends ChesterReactionPayload {
  id: number;
}

interface ChesterReactionContextValue {
  /** The reaction currently being displayed, if any */
  current: QueuedReaction | null;
  /** Show a reaction. If one is already showing, queues behind it. */
  showReaction: (reaction: ChesterReactionPayload) => void;
  /** Force-dismiss the current reaction immediately */
  dismissCurrent: () => void;
}

const ChesterReactionContext = createContext<ChesterReactionContextValue | null>(null);

const DEFAULT_DURATION_MS = 3500;
const MAX_QUEUE = 4; // drop oldest if more than this pile up

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChesterReactionProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<QueuedReaction | null>(null);
  const queueRef = useRef<QueuedReaction[]>([]);
  const idRef = useRef(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    setCurrent(next);
    if (next) {
      const duration = next.durationMs ?? DEFAULT_DURATION_MS;
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        dismissTimerRef.current = null;
        advance();
      }, duration);
    }
  }, []);

  const showReaction = useCallback((payload: ChesterReactionPayload) => {
    const queued: QueuedReaction = { ...payload, id: ++idRef.current };

    // If nothing's currently displayed, show immediately
    setCurrent(prev => {
      if (prev === null) {
        const duration = queued.durationMs ?? DEFAULT_DURATION_MS;
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = setTimeout(() => {
          dismissTimerRef.current = null;
          advance();
        }, duration);
        return queued;
      }
      // Otherwise queue, capped
      queueRef.current.push(queued);
      if (queueRef.current.length > MAX_QUEUE) {
        queueRef.current.splice(0, queueRef.current.length - MAX_QUEUE);
      }
      return prev;
    });
  }, [advance]);

  const dismissCurrent = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
    advance();
  }, [advance]);

  // Subscribe to storage-layer events and translate them into reactions.
  useEffect(() => {
    const unsubscribe = subscribeChesterEvents(event => {
      const payload = eventToReaction(event);
      if (payload) showReaction(payload);

      // Level-up gets its own follow-up reaction so the user sees the main
      // "yum" first, then the level-up celebration.
      if (event.type === 'chester_fed' && event.leveledUp) {
        showReaction({
          message: `Level up! Chester is now level ${event.newLevel}.`,
          score: 'great',
          animation: 'levelUp',
          durationMs: 4000,
        });
      }
    });
    return unsubscribe;
  }, [showReaction]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  const value = useMemo(
    () => ({ current, showReaction, dismissCurrent }),
    [current, showReaction, dismissCurrent],
  );

  return (
    <ChesterReactionContext.Provider value={value}>
      {children}
    </ChesterReactionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChesterReactions(): ChesterReactionContextValue {
  const ctx = useContext(ChesterReactionContext);
  if (!ctx) {
    throw new Error('useChesterReactions must be used inside ChesterReactionProvider');
  }
  return ctx;
}

// ─── Event → Reaction mapping ────────────────────────────────────────────────

function eventToReaction(event: ChesterEvent): ChesterReactionPayload | null {
  switch (event.type) {
    case 'chester_fed': {
      const messages: Record<ReactionScore, string[]> = {
        great: ['Yum! Chester loves it!', 'Perfect choice!', 'Tail-wag worthy!'],
        good:  ['Tasty! Good pick.', 'Chester approves.', 'Nice one!'],
        okay:  ['Hmm, not bad.', 'Okay snack!', 'Chester munched it down.'],
        poor:  ['Not great, but Chester ate it.', 'You can do better!', 'Chester gives a side-eye...'],
      };
      const pool = messages[event.score];
      const message = event.streakIncreased
        ? `Day ${event.newStreak} streak! ${pool[0]}`
        : pool[Math.floor(Math.random() * pool.length)];
      return {
        message,
        score: event.score,
        animation: 'eating',
        durationMs: 3500,
      };
    }

    case 'achievement_unlocked':
      return {
        message: `${event.achievement.icon} Achievement unlocked: ${event.achievement.title}!`,
        score: 'great',
        animation: 'achievement',
        durationMs: 4500,
      };

    case 'streak_milestone':
      return {
        message: event.milestone.chesterMessage,
        score: 'great',
        animation: 'streak',
        durationMs: 4500,
      };

    case 'water_logged':
      if (event.goalReached) {
        return {
          message: `💧 Hydration goal hit! Chester is so refreshed.`,
          score: 'great',
          animation: 'drinking',
          durationMs: 3500,
        };
      }
      return {
        message: `Glug glug — ${event.glasses} glass${event.glasses === 1 ? '' : 'es'} today.`,
        score: 'good',
        animation: 'drinking',
        durationMs: 2500,
      };

    case 'dig_completed': {
      const r = event.reward;
      return {
        message: `${r.icon} ${r.title} — ${r.description}`.trim(),
        score: r.rarity === 'super_rare' || r.rarity === 'rare' ? 'great' : 'good',
        animation: 'digReveal',
        durationMs: 4500,
      };
    }

    case 'shop_purchase':
      return {
        message: `Looking sharp! ${event.itemName} added to your collection.`,
        score: 'good',
        animation: 'happy',
        durationMs: 3000,
      };

    case 'cosmetic_equipped':
      return {
        message: `Strutting in the new ${event.itemName}!`,
        animation: 'happy',
        durationMs: 2500,
      };

    case 'chester_petted': {
      const moodMessages: Record<typeof event.mood, string[]> = {
        happy:   ['Hi friend!', 'Such a good boop!', 'Tail wagging!'],
        excited: ['Zoomies incoming!', 'Best day ever!', 'AWOOOO!'],
        neutral: ['Boop!', 'Hello you!', "What's up?"],
        hungry:  ['Got a snack?', 'My tummy says hi.', 'Feed me?'],
        sleepy:  ['Mmmh... five more minutes.', 'Cosy.', 'Yawn...'],
        sad:     ['Thanks for checking on me.', 'You make me feel better.', 'I needed that.'],
      };
      const pool = moodMessages[event.mood] ?? moodMessages.neutral;
      return {
        message: pool[Math.floor(Math.random() * pool.length)],
        animation: 'happy',
        durationMs: 2200,
      };
    }

    default:
      return null;
  }
}
