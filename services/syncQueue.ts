import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { canSync } from './firestore';

// ─── Sync Queue ───
//
// Queues write operations when offline and flushes them
// when connectivity returns. Each entry records what type
// of data changed so we can replay the sync.

const QUEUE_KEY = 'sync_queue';

export type SyncAction =
  | { type: 'profile' }
  | { type: 'foodLog'; date: string }
  | { type: 'waterLog'; date: string }
  | { type: 'challenges' }
  | { type: 'settings' }
  | { type: 'fullSync' };

interface QueueEntry {
  action: SyncAction;
  timestamp: number;
}

// ─── Queue Operations ───

async function getQueue(): Promise<QueueEntry[]> {
  const data = await AsyncStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

async function saveQueue(queue: QueueEntry[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(action: SyncAction): Promise<void> {
  const queue = await getQueue();

  // Deduplicate: if the same action already exists, update its timestamp
  const existingIndex = queue.findIndex(entry => {
    if (entry.action.type !== action.type) return false;
    if (action.type === 'foodLog' && entry.action.type === 'foodLog') {
      return action.date === entry.action.date;
    }
    if (action.type === 'waterLog' && entry.action.type === 'waterLog') {
      return action.date === entry.action.date;
    }
    return true;
  });

  if (existingIndex >= 0) {
    queue[existingIndex].timestamp = Date.now();
  } else {
    queue.push({ action, timestamp: Date.now() });
  }

  await saveQueue(queue);
}

export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

// ─── Flush Queue ───
//
// Replays all queued actions by calling the appropriate sync functions.
// Failed items stay in the queue for the next attempt.

export async function flushQueue(): Promise<{ flushed: number; failed: number }> {
  if (!canSync()) return { flushed: 0, failed: 0 };

  const queue = await getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  // Lazy import to avoid circular deps
  const firestore = await import('./firestore');

  const failed: QueueEntry[] = [];
  let flushed = 0;

  for (const entry of queue) {
    try {
      switch (entry.action.type) {
        case 'profile':
          await firestore.syncProfileToCloud();
          break;
        case 'foodLog':
          await firestore.syncFoodLogToCloud(entry.action.date);
          break;
        case 'waterLog':
          await firestore.syncWaterLogToCloud(entry.action.date);
          break;
        case 'challenges':
          await firestore.syncChallengesToCloud();
          break;
        case 'settings':
          await firestore.syncSettingsToCloud();
          break;
        case 'fullSync':
          await firestore.performFullSync();
          break;
      }
      flushed++;
    } catch {
      failed.push(entry);
    }
  }

  // Save any failed items back to queue
  await saveQueue(failed);

  return { flushed, failed: failed.length };
}

// ─── Connectivity Detection ───

let isOnline = true;
let unsubscribeNetInfo: (() => void) | null = null;

export function getIsOnline(): boolean {
  return isOnline;
}

export function startConnectivityListener(): void {
  if (unsubscribeNetInfo) return; // Already listening

  unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
    const wasOffline = !isOnline;
    isOnline = state.isConnected === true && state.isInternetReachable !== false;

    // Just came back online — flush the queue
    if (wasOffline && isOnline) {
      flushQueue().catch(() => {});
    }
  });
}

export function stopConnectivityListener(): void {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
}

// ─── Smart Sync ───
//
// Called by storage operations instead of direct Firestore calls.
// If online and signed in, syncs immediately.
// If offline, queues for later.

export async function smartSync(action: SyncAction): Promise<void> {
  if (isOnline && canSync()) {
    // Try immediate sync
    try {
      const firestore = await import('./firestore');
      switch (action.type) {
        case 'profile':
          await firestore.syncProfileToCloud();
          break;
        case 'foodLog':
          await firestore.syncFoodLogToCloud(action.date);
          break;
        case 'waterLog':
          await firestore.syncWaterLogToCloud(action.date);
          break;
        case 'challenges':
          await firestore.syncChallengesToCloud();
          break;
        case 'settings':
          await firestore.syncSettingsToCloud();
          break;
        case 'fullSync':
          await firestore.performFullSync();
          break;
      }
    } catch {
      // Sync failed — queue it for retry
      await enqueue(action);
    }
  } else {
    // Offline or not signed in — queue for later
    await enqueue(action);
  }
}
