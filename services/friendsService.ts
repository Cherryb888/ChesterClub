import {
  doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, getCurrentUser, isFirebaseConfigured } from './firebase';
import { getProfile } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FRIEND_CODE_KEY = 'my_friend_code';

export interface FriendProfile {
  uid: string;
  displayName: string;
  friendCode: string;
  chesterLevel: number;
  chesterMood: string;
  streak: number;
  achievementCount: number;
  lifeStage: string;
}

// ─── Friend Code Generation ───

function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: 0,O,1,I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXXX-XXXX
  return code.slice(0, 4) + '-' + code.slice(4);
}

export async function getMyFriendCode(): Promise<string> {
  // Check local cache first
  const cached = await AsyncStorage.getItem(FRIEND_CODE_KEY);
  if (cached) return cached;

  // Generate new code
  const code = generateFriendCode();
  await AsyncStorage.setItem(FRIEND_CODE_KEY, code);

  // Publish to Firestore if signed in
  await publishFriendCode(code);
  return code;
}

async function publishFriendCode(code: string): Promise<void> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return;

  const profile = await getProfile();

  // Store in friendCodes collection for lookup
  await setDoc(doc(db, 'friendCodes', code), {
    uid: user.uid,
    displayName: profile.displayName,
    createdAt: serverTimestamp(),
  });

  // Store in user's profile for reference
  await setDoc(doc(db, 'users', user.uid, 'profile', 'social'), {
    friendCode: code,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Public Profile ───

export async function publishPublicProfile(): Promise<void> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return;

  const profile = await getProfile();
  const code = await getMyFriendCode();

  await setDoc(doc(db, 'publicProfiles', user.uid), {
    displayName: profile.displayName,
    friendCode: code,
    chesterLevel: profile.chester.level,
    chesterMood: profile.chester.mood,
    streak: profile.chester.streak,
    achievementCount: profile.chester.achievements.length,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Add Friend ───

export async function addFriendByCode(code: string): Promise<{ success: boolean; error?: string; friend?: FriendProfile }> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return { success: false, error: 'Sign in to add friends' };

  const normalizedCode = code.toUpperCase().trim();

  // Validate format (XXXX-XXXX, alphanumeric without ambiguous chars)
  if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(normalizedCode)) {
    return { success: false, error: 'Invalid friend code format. Use format: XXXX-XXXX' };
  }

  // Check if it's own code
  const myCode = await getMyFriendCode();
  if (normalizedCode === myCode) return { success: false, error: "That's your own friend code!" };

  // Look up friend code
  const codeSnap = await getDoc(doc(db, 'friendCodes', normalizedCode));
  if (!codeSnap.exists()) return { success: false, error: 'Friend code not found' };

  const codeData = codeSnap.data();
  const friendUid = codeData.uid;

  // Check if already friends
  const existingSnap = await getDoc(doc(db, 'users', user.uid, 'friends', friendUid));
  if (existingSnap.exists()) return { success: false, error: 'Already friends!' };

  // Get friend's public profile
  const profileSnap = await getDoc(doc(db, 'publicProfiles', friendUid));
  const friendData = profileSnap.exists() ? profileSnap.data() : { displayName: codeData.displayName };

  // Add friend (bidirectional)
  const now = serverTimestamp();
  await setDoc(doc(db, 'users', user.uid, 'friends', friendUid), {
    uid: friendUid,
    displayName: friendData.displayName || 'Friend',
    addedAt: now,
  });

  await setDoc(doc(db, 'users', friendUid, 'friends', user.uid), {
    uid: user.uid,
    displayName: (await getProfile()).displayName || 'Friend',
    addedAt: now,
  });

  // Publish own profile so friend can see stats
  await publishPublicProfile();

  return {
    success: true,
    friend: {
      uid: friendUid,
      displayName: friendData.displayName || 'Friend',
      friendCode: normalizedCode,
      chesterLevel: friendData.chesterLevel || 1,
      chesterMood: friendData.chesterMood || 'happy',
      streak: friendData.streak || 0,
      achievementCount: friendData.achievementCount || 0,
      lifeStage: getLifeStageFromLevel(friendData.chesterLevel || 1),
    },
  };
}

// ─── Get Friends List ───

export async function getFriendsList(): Promise<FriendProfile[]> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return [];

  const friendsSnap = await getDocs(collection(db, 'users', user.uid, 'friends'));
  const friends: FriendProfile[] = [];

  for (const friendDoc of friendsSnap.docs) {
    const data = friendDoc.data();
    const uid = data.uid;

    // Get friend's public profile for latest stats
    const profileSnap = await getDoc(doc(db, 'publicProfiles', uid));
    const profileData = profileSnap.exists() ? profileSnap.data() : {};

    friends.push({
      uid,
      displayName: profileData.displayName || data.displayName || 'Friend',
      friendCode: profileData.friendCode || '',
      chesterLevel: profileData.chesterLevel || 1,
      chesterMood: profileData.chesterMood || 'happy',
      streak: profileData.streak || 0,
      achievementCount: profileData.achievementCount || 0,
      lifeStage: getLifeStageFromLevel(profileData.chesterLevel || 1),
    });
  }

  // Sort by streak (highest first), then level
  return friends.sort((a, b) => b.streak - a.streak || b.chesterLevel - a.chesterLevel);
}

// ─── Remove Friend ───

export async function removeFriend(friendUid: string): Promise<void> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return;

  await deleteDoc(doc(db, 'users', user.uid, 'friends', friendUid));
  await deleteDoc(doc(db, 'users', friendUid, 'friends', user.uid));
}

// ─── Friend Count ───

export async function getFriendCount(): Promise<number> {
  const db = getDb();
  const user = getCurrentUser();
  if (!db || !user) return 0;

  const snap = await getDocs(collection(db, 'users', user.uid, 'friends'));
  return snap.size;
}

// ─── Helper ───

function getLifeStageFromLevel(level: number): string {
  if (level >= 50) return 'golden';
  if (level >= 31) return 'champion';
  if (level >= 16) return 'adult';
  if (level >= 6) return 'young';
  return 'puppy';
}

export function getLifeStageEmoji(stage: string): string {
  const map: Record<string, string> = {
    puppy: '🐶',
    young: '🐕',
    adult: '🦮',
    champion: '🏆🐕',
    golden: '👑🐕‍🦺',
  };
  return map[stage] || '🐶';
}

export function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    happy: '😊',
    excited: '🤩',
    neutral: '😐',
    hungry: '😋',
    sleepy: '😴',
    sad: '😢',
  };
  return map[mood] || '😊';
}
