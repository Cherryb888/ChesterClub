import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import {
  signIn, signUp, signOut, sendPasswordResetEmail,
  signInWithGoogle, signInWithApple, isAppleSignInAvailable,
  isFirebaseConfigured, getCurrentUser, onAuthChange,
} from '../../services/firebase';
import { performFullSync } from '../../services/firestore';
import { getProfile, saveProfile } from '../../services/storage';

type AuthMode = 'sign_in' | 'sign_up' | 'reset_password';

export default function AuthScreen() {
  const router = useRouter();
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

  if (!isFirebaseConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={64} color={Colors.textLight} />
          <Text style={styles.errorTitle}>Firebase Not Configured</Text>
          <Text style={styles.errorText}>
            Add your Firebase config to .env to enable accounts and cloud sync.
          </Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Signed-in view
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.signedInSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.signedInName}>{user.displayName || 'User'}</Text>
            <Text style={styles.signedInEmail}>{user.email}</Text>

            <View style={styles.signedInBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.signedInBadgeText}>Signed in & syncing</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.syncBtn}
            onPress={async () => {
              setLoading(true);
              const result = await performFullSync();
              setLoading(false);
              if (result.success) {
                Alert.alert('Synced!', 'All data synced to cloud.');
              } else {
                Alert.alert('Sync Failed', result.error || 'Try again later.');
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.syncBtnText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => {
              Alert.alert(
                'Sign Out',
                'Would you like to sync your data before signing out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sync & Sign Out', onPress: async () => {
                      setLoading(true);
                      await performFullSync();
                      await signOut();
                      setLoading(false);
                      Alert.alert('Signed Out', 'Your data has been synced and saved.');
                    }
                  },
                  {
                    text: 'Sign Out Only', style: 'destructive', onPress: async () => {
                      await signOut();
                    }
                  },
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Auth form
  const handleEmailAuth = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }

    if (mode === 'reset_password') {
      setLoading(true);
      try {
        await sendPasswordResetEmail(email.trim());
        Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
        setMode('sign_in');
      } catch (error: any) {
        Alert.alert('Error', getAuthErrorMessage(error.code));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (mode === 'sign_up' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign_up') {
        await signUp(email.trim(), password);
        // Update profile with email
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      const user = getCurrentUser();
      if (user) {
        const profile = await getProfile();
        profile.email = user.email || profile.email;
        profile.displayName = user.displayName || profile.displayName;
        profile.uid = user.uid;
        await saveProfile(profile);
      }
      Alert.alert('Welcome!', 'Signed in with Google. Chester is syncing your data!');
    } catch (error: any) {
      if (error.message !== 'Google sign-in was cancelled') {
        Alert.alert('Error', error.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithApple();
      const user = getCurrentUser();
      if (user) {
        const profile = await getProfile();
        profile.email = user.email || profile.email;
        profile.displayName = user.displayName || profile.displayName;
        profile.uid = user.uid;
        await saveProfile(profile);
      }
      Alert.alert('Welcome!', 'Signed in with Apple. Chester is syncing your data!');
    } catch (error: any) {
      if (!error.message?.includes('cancelled')) {
        Alert.alert('Error', error.message || 'Apple sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'sign_in' ? 'Welcome Back' : mode === 'sign_up' ? 'Create Account' : 'Reset Password'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'sign_in'
              ? 'Sign in to sync Chester across your devices'
              : mode === 'sign_up'
                ? 'Create an account to save your progress'
                : 'We\'ll send you a link to reset your password'}
          </Text>
        </View>

        {/* Social sign-in (not for password reset) */}
        {mode !== 'reset_password' && (
          <View style={styles.socialSection}>
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {isAppleSignInAvailable() && (
              <TouchableOpacity style={styles.appleBtn} onPress={handleAppleSignIn} disabled={loading}>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={styles.appleBtnText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        )}

        {/* Email form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.textLight} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {mode !== 'reset_password' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === 'sign_up' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>
          )}

          {/* Forgot password link */}
          {mode === 'sign_in' && (
            <TouchableOpacity onPress={() => setMode('reset_password')} style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Submit button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleEmailAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'sign_in' ? 'Sign In' : mode === 'sign_up' ? 'Create Account' : 'Send Reset Link'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle between sign in / sign up */}
        <View style={styles.toggleRow}>
          {mode === 'reset_password' ? (
            <TouchableOpacity onPress={() => setMode('sign_in')}>
              <Text style={styles.toggleText}>
                Back to <Text style={styles.toggleLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}>
              <Text style={styles.toggleText}>
                {mode === 'sign_in' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleLink}>
                  {mode === 'sign_in' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password. Try again or reset it.';
    case 'auth/weak-password': return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed': return 'Network error. Check your internet connection.';
    case 'auth/invalid-credential': return 'Invalid email or password. Please try again.';
    default: return `Authentication error (${code}). Please try again.`;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },

  backBtn: { marginBottom: Spacing.md },
  backLink: { marginTop: Spacing.lg },
  backLinkText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primary },

  // Header
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: 22 },

  errorTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  errorText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  // Social buttons
  socialSection: { marginBottom: Spacing.md },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  googleIcon: { fontSize: FontSize.lg, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#000',
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.sm,
  },
  appleBtnText: { fontSize: FontSize.md, fontWeight: '600', color: '#fff' },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.lg, gap: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.sm, color: Colors.textLight, fontWeight: '500' },

  // Form
  form: {},
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  input: {
    flex: 1, fontSize: FontSize.md, color: Colors.text,
    paddingVertical: Spacing.md,
  },
  forgotLink: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotLinkText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },

  // Toggle
  toggleRow: { alignItems: 'center', marginTop: Spacing.xl },
  toggleText: { fontSize: FontSize.md, color: Colors.textSecondary },
  toggleLink: { color: Colors.primary, fontWeight: '700' },

  // Signed in
  signedInSection: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.xl },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  avatarLetter: { fontSize: FontSize.xxl, fontWeight: '800', color: '#fff' },
  signedInName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  signedInEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  signedInBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.success + '15', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.md,
  },
  signedInBadgeText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.success },

  syncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  syncBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderWidth: 2, borderColor: Colors.error,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  signOutBtnText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '600' },
});
