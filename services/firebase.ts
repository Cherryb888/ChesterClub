import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as firebaseSignOut, onAuthStateChanged,
  sendPasswordResetEmail as firebaseResetPassword,
  GoogleAuthProvider, OAuthProvider, signInWithCredential,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

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
let db: ReturnType<typeof getFirestore> | null = null;

if (isConfigured && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// ─── Email/Password Auth ───

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

export async function sendPasswordResetEmail(email: string) {
  if (!auth) throw new Error('Firebase not configured');
  return firebaseResetPassword(auth, email);
}

// ─── Google Sign-In ───

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase not configured');

  // Use Firebase Auth's Google provider via signInWithCredential
  // For Expo, we use AuthSession to get the Google ID token
  const redirectUri = AuthSession.makeRedirectUri();
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Google Client ID not configured. Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to .env');
  }

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.IdToken,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.id_token) {
    throw new Error('Google sign-in was cancelled');
  }

  const credential = GoogleAuthProvider.credential(result.params.id_token);
  return signInWithCredential(auth, credential);
}

// ─── Apple Sign-In ───

export async function signInWithApple() {
  if (!auth) throw new Error('Firebase not configured');
  if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is only available on iOS');

  const nonce = Math.random().toString(36).substring(2, 10);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple sign-in failed — no identity token');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce: nonce,
  });

  return signInWithCredential(auth, credential);
}

export function isAppleSignInAvailable(): boolean {
  return Platform.OS === 'ios';
}

// ─── Auth State ───

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth?.currentUser ?? null;
}

export function getDb() {
  return db;
}

export { isConfigured as isFirebaseConfigured };
