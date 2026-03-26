import {
  doc, setDoc, getDocs, collection, query, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { getDb, getCurrentUser, isFirebaseConfigured } from './firebase';
import { getProfile } from './storage';
import { getFriendsList } from './friendsService';

export type FeedItemType = 'meal' | 'streak_milestone' | 'achievement' | 'level_up' | 'life_stage';

export interface FeedItem {
  id: string;
  uid: string;
  displayName: string;
  type: FeedItemType;
  title: string;
  subtitle: string;
  icon: string;
  timestamp: number;
  isMe: boolean;
}

// ─── Post to Feed ───

export async function postToFeed(data: {
  type: FeedItemType;
  title: string;
  subtitle: string;
  icon: string;
}): Promise<void> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return;

  const profile = await getProfile();
  const postId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await setDoc(doc(db, 'users', user.uid, 'feed', postId), {
    type: data.type,
    title: data.title,
    subtitle: data.subtitle,
    icon: data.icon,
    displayName: profile.displayName,
    createdAt: serverTimestamp(),
  });
}

// ─── Share Helpers ───

export async function shareMeal(foodName: string, calories: number, score: string): Promise<void> {
  const scoreEmoji = score === 'great' ? '🌟' : score === 'good' ? '⭐' : '🍽️';
  await postToFeed({
    type: 'meal',
    title: `Logged: ${foodName}`,
    subtitle: `${calories} cal — ${score} meal ${scoreEmoji}`,
    icon: '🍽️',
  });
}

export async function shareStreakMilestone(days: number): Promise<void> {
  await postToFeed({
    type: 'streak_milestone',
    title: `${days}-Day Streak!`,
    subtitle: `On fire! ${days} days of consistent tracking.`,
    icon: '🔥',
  });
}

export async function shareAchievement(title: string, icon: string): Promise<void> {
  await postToFeed({
    type: 'achievement',
    title: `Unlocked: ${title}`,
    subtitle: 'New achievement earned!',
    icon,
  });
}

export async function shareLevelUp(level: number): Promise<void> {
  await postToFeed({
    type: 'level_up',
    title: `Chester reached Level ${level}!`,
    subtitle: 'Growing stronger every day.',
    icon: '⬆️',
  });
}

export async function shareLifeStage(stage: string): Promise<void> {
  const stageNames: Record<string, string> = {
    puppy: 'Puppy', young: 'Young Dog', adult: 'Adult Dog',
    champion: 'Champion', golden: 'Golden Chester',
  };
  await postToFeed({
    type: 'life_stage',
    title: `Chester evolved to ${stageNames[stage] || stage}!`,
    subtitle: 'A major milestone reached!',
    icon: '🎉',
  });
}

// ─── Load Friend Feed ───

export async function getFriendFeed(): Promise<FeedItem[]> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return [];

  const friends = await getFriendsList();
  const allUids = [user.uid, ...friends.map(f => f.uid)];
  const friendNameMap = new Map<string, string>();
  friendNameMap.set(user.uid, 'You');
  for (const f of friends) friendNameMap.set(f.uid, f.displayName);

  const allItems: FeedItem[] = [];

  // Fetch recent posts from each user (self + friends)
  for (const uid of allUids) {
    try {
      const feedRef = collection(db, 'users', uid, 'feed');
      const q = query(feedRef, orderBy('createdAt', 'desc'), limit(10));
      const snap = await getDocs(q);

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const createdAt = data.createdAt;
        const timestamp = createdAt instanceof Timestamp
          ? createdAt.toMillis()
          : typeof createdAt === 'number' ? createdAt : Date.now();

        allItems.push({
          id: docSnap.id,
          uid,
          displayName: data.displayName || friendNameMap.get(uid) || 'Friend',
          type: data.type,
          title: data.title,
          subtitle: data.subtitle,
          icon: data.icon || '📝',
          timestamp,
          isMe: uid === user.uid,
        });
      }
    } catch {
      // Skip if can't read a friend's feed
    }
  }

  // Sort by timestamp, newest first
  return allItems.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
}
