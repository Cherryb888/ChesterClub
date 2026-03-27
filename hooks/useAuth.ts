import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  signIn, signUp, signOut, sendPasswordResetEmail,
  signInWithGoogle, signInWithApple,
  getCurrentUser, onAuthChange,
} from '../services/firebase';
import { performFullSync } from '../services/firestore';
import { getProfile, saveProfile } from '../services/storage';

export type AuthMode = 'sign_in' | 'sign_up' | 'reset_password';

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':    return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email':           return 'Please enter a valid email address.';
    case 'auth/user-not-found':          return 'No account found with this email.';
    case 'auth/wrong-password':          return 'Incorrect password. Try again or reset it.';
    case 'auth/weak-password':           return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':       return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':  return 'Network error. Check your internet connection.';
    case 'auth/invalid-credential':      return 'Invalid email or password. Please try again.';
    default: return `Authentication error (${code}). Please try again.`;
  }
}

export function useAuth() {
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return unsub;
  }, []);

  const handleEmailAuth = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email.'); return; }

    if (mode === 'reset_password') {
      setLoading(true);
      try {
        await sendPasswordResetEmail(email.trim());
        Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
        setMode('sign_in');
      } catch (error: any) {
        Alert.alert('Error', getAuthErrorMessage(error.code));
      } finally { setLoading(false); }
      return;
    }

    if (!password || password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    if (mode === 'sign_up' && password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match.'); return; }

    setLoading(true);
    try {
      if (mode === 'sign_up') {
        await signUp(email.trim(), password);
        const profile = await getProfile();
        profile.email = email.trim();
        profile.uid = getCurrentUser()?.uid || profile.uid;
        await saveProfile(profile);
        Alert.alert('Welcome!', 'Account created. Chester will now sync your data across devices!');
      } else {
        await signIn(email.trim(), password);
        Alert.alert('Welcome back!', 'Chester is syncing your data...');
      }
    } catch (error: any) {
      Alert.alert('Error', getAuthErrorMessage(error.code));
    } finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      const u = getCurrentUser();
      if (u) {
        const profile = await getProfile();
        profile.email = u.email || profile.email;
        profile.displayName = u.displayName || profile.displayName;
        profile.uid = u.uid;
        await saveProfile(profile);
      }
      Alert.alert('Welcome!', 'Signed in with Google. Chester is syncing your data!');
    } catch (error: any) {
      if (error.message !== 'Google sign-in was cancelled') Alert.alert('Error', error.message || 'Google sign-in failed.');
    } finally { setLoading(false); }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithApple();
      const u = getCurrentUser();
      if (u) {
        const profile = await getProfile();
        profile.email = u.email || profile.email;
        profile.displayName = u.displayName || profile.displayName;
        profile.uid = u.uid;
        await saveProfile(profile);
      }
      Alert.alert('Welcome!', 'Signed in with Apple. Chester is syncing your data!');
    } catch (error: any) {
      if (!error.message?.includes('cancelled')) Alert.alert('Error', error.message || 'Apple sign-in failed.');
    } finally { setLoading(false); }
  };

  const handleSyncNow = async (setLoading: (v: boolean) => void) => {
    setLoading(true);
    const result = await performFullSync();
    setLoading(false);
    if (result.success) Alert.alert('Synced!', 'All data synced to cloud.');
    else Alert.alert('Sync Failed', result.error || 'Try again later.');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Would you like to sync your data before signing out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sync & Sign Out', onPress: async () => {
          setLoading(true);
          await performFullSync();
          await signOut();
          setLoading(false);
          Alert.alert('Signed Out', 'Your data has been synced and saved.');
        },
      },
      { text: 'Sign Out Only', style: 'destructive', onPress: async () => { await signOut(); } },
    ]);
  };

  return {
    mode, setMode,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading, setLoading,
    showPassword, setShowPassword,
    user,
    handleEmailAuth,
    handleGoogleSignIn,
    handleAppleSignIn,
    handleSyncNow,
    handleSignOut,
  };
}
