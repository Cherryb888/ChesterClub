import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { isAppleSignInAvailable, isFirebaseConfigured } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';

export default function AuthScreen() {
  const router = useRouter();
  const {
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
  } = useAuth();

  if (!isFirebaseConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={64} color={Colors.textLight} />
          <Text style={styles.errorTitle}>Firebase Not Configured</Text>
          <Text style={styles.errorText}>Add your Firebase config to .env to enable accounts and cloud sync.</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.signedInSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{(user.displayName || user.email || 'U')[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.signedInName}>{user.displayName || 'User'}</Text>
            <Text style={styles.signedInEmail}>{user.email}</Text>
            <View style={styles.signedInBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.signedInBadgeText}>Signed in & syncing</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.syncBtn} onPress={() => handleSyncNow(setLoading)} disabled={loading} accessibilityLabel="Sync now" accessibilityRole="button">
            {loading ? <ActivityIndicator color="#fff" accessibilityLabel="Syncing" /> : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.syncBtnText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} accessibilityLabel="Sign out" accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Auth form
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {mode === 'sign_in' ? 'Welcome Back' : mode === 'sign_up' ? 'Create Account' : 'Reset Password'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'sign_in'
              ? 'Sign in to sync Chester across your devices'
              : mode === 'sign_up'
                ? 'Create an account to save your progress'
                : "We'll send you a link to reset your password"}
          </Text>
        </View>

        {mode !== 'reset_password' && (
          <View style={styles.socialSection}>
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading} accessibilityLabel="Continue with Google" accessibilityRole="button">
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
            {isAppleSignInAvailable() && (
              <TouchableOpacity style={styles.appleBtn} onPress={handleAppleSignIn} disabled={loading} accessibilityLabel="Continue with Apple" accessibilityRole="button">
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
                accessibilityLabel="Email address"
                accessibilityHint="Enter your email"
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
                  accessibilityLabel="Password"
                  accessibilityHint="Minimum 6 characters"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} accessibilityRole="button">
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
                  accessibilityLabel="Confirm password"
                  accessibilityHint="Re-enter your password"
                />
              </View>
            </View>
          )}

          {mode === 'sign_in' && (
            <TouchableOpacity onPress={() => setMode('reset_password')} style={styles.forgotLink} accessibilityLabel="Forgot password" accessibilityRole="button">
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleEmailAuth} disabled={loading} accessibilityLabel={mode === 'sign_in' ? 'Sign in' : mode === 'sign_up' ? 'Create account' : 'Send reset link'} accessibilityRole="button">
            {loading ? <ActivityIndicator color="#fff" accessibilityLabel="Loading" /> : (
              <Text style={styles.submitBtnText}>
                {mode === 'sign_in' ? 'Sign In' : mode === 'sign_up' ? 'Create Account' : 'Send Reset Link'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.toggleRow}>
          {mode === 'reset_password' ? (
            <TouchableOpacity onPress={() => setMode('sign_in')} accessibilityLabel="Back to sign in" accessibilityRole="button">
              <Text style={styles.toggleText}>Back to <Text style={styles.toggleLink}>Sign In</Text></Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')} accessibilityLabel={mode === 'sign_in' ? 'Switch to sign up' : 'Switch to sign in'} accessibilityRole="button">
              <Text style={styles.toggleText}>
                {mode === 'sign_in' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleLink}>{mode === 'sign_in' ? 'Sign Up' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  backBtn: { marginBottom: Spacing.md },
  backLink: { marginTop: Spacing.lg },
  backLinkText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primary },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: 22 },
  errorTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  errorText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  socialSection: { marginBottom: Spacing.md },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  googleIcon: { fontSize: FontSize.lg, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: '#000', borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.sm },
  appleBtnText: { fontSize: FontSize.md, fontWeight: '600', color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg, gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.sm, color: Colors.textLight, fontWeight: '500' },
  form: {},
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.text, paddingVertical: Spacing.md },
  forgotLink: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotLinkText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  toggleRow: { alignItems: 'center', marginTop: Spacing.xl },
  toggleText: { fontSize: FontSize.md, color: Colors.textSecondary },
  toggleLink: { color: Colors.primary, fontWeight: '700' },
  signedInSection: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.xl },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  avatarLetter: { fontSize: FontSize.xxl, fontWeight: '800', color: '#fff' },
  signedInName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md },
  signedInEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  signedInBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.success + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.md },
  signedInBadgeText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.success },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  syncBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 2, borderColor: Colors.error, borderRadius: BorderRadius.lg, padding: Spacing.md },
  signOutBtnText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '600' },
});
