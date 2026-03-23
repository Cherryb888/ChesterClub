import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Only initialize if config is provided
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your-firebase-api-key';

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

if (isConfigured && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export async function signUp(email: string, password: string) {
  if (!auth) throw new Error('Firebase not configured');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signIn(email: string, password: string) {
  if (!auth) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  if (!auth) return;
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    // Firebase not configured - run in local-only mode
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { isConfigured as isFirebaseConfigured };
