import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getProfile, saveProfile } from '../../services/storage';
import { UserProfile } from '../../types';
import {
  fetchSubscriptions,
  purchaseSubscription,
  setupPurchaseListeners,
  restorePremiumPurchases,
  isIAPAvailable,
} from '../../services/iapService';
import type { SubscriptionPlan } from '../../services/iapService';

const FEATURES = [
  {
    icon: 'sparkles',
    title: '2x Coin Rewards',
    description: 'Earn double coins on every challenge you complete',
    free: false,
  },
  {
    icon: 'restaurant',
    title: 'AI Meal Plans',
    description: 'Unlimited personalized AI-generated meal plans',
    free: false,
  },
  {
    icon: 'camera',
    title: 'AI Food Scanner',
    description: 'Scan unlimited meals with AI recognition',
    free: true,
  },
  {
    icon: 'trophy',
    title: 'Premium Challenges',
    description: 'Access exclusive high-reward challenges',
    free: false,
  },
  {
    icon: 'color-palette',
    title: 'Chester Accessories',
    description: 'Unlock exclusive outfits and accessories for Chester',
    free: false,
  },
  {
    icon: 'analytics',
    title: 'Advanced Insights',
    description: 'Detailed nutrition analytics and weekly AI reports',
    free: false,
  },
  {
    icon: 'shield-checkmark',
    title: 'Priority Support',
    description: 'Get help faster with priority customer support',
    free: false,
  },
  {
    icon: 'cloud-upload',
    title: 'Cloud Backup',
    description: 'Automatic cloud sync so you never lose your data',
    free: false,
  },
];

// Fallback prices shown before store products are loaded
const FALLBACK_PRICES: Record<SubscriptionPlan, string> = {
  monthly: '$4.99/mo',
  yearly: '$29.99/yr',
};

export default function PremiumScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [storePrices, setStorePrices] = useState<Partial<Record<SubscriptionPlan, string>>>({});
  const cleanupListeners = useRef<(() => void) | null>(null);

  // Load profile
  useFocusEffect(useCallback(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
    })();
  }, []));

  // Subscribe to purchase results for this screen's lifetime + fetch prices.
  // The IAP connection is initialised once at the root layout, not here.
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;

      // Wire up purchase listeners for this screen's lifetime
      cleanupListeners.current = setupPurchaseListeners(
        // onSuccess
        async (result) => {
          const updated = await getProfile();
          if (mounted) setProfile(updated);
          setPurchasing(false);
          if (result.kind === 'subscription') {
            Alert.alert(
              '🎉 Welcome to Premium!',
              'You now have full access to all premium features. 2x coins are active!',
            );
          } else if (result.kind === 'coin_pack') {
            Alert.alert(
              '🪙 Coins added!',
              `${result.coinsAdded} coins added to your balance.`,
            );
          }
        },
        // onError
        (message) => {
          setPurchasing(false);
          Alert.alert('Purchase Failed', message);
        },
      );

      // Fetch real prices (localizedPrice comes from the store)
      const subs = await fetchSubscriptions();
      if (!mounted) return;
      const prices: Partial<Record<SubscriptionPlan, string>> = {};
      for (const sub of subs) {
        if (sub.productId.includes('monthly') && (sub as any).localizedPrice) {
          prices.monthly = `${(sub as any).localizedPrice}/mo`;
        }
        if (sub.productId.includes('yearly') && (sub as any).localizedPrice) {
          prices.yearly = `${(sub as any).localizedPrice}/yr`;
        }
      }
      setStorePrices(prices);
    })();

    return () => {
      mounted = false;
      cleanupListeners.current?.();
    };
  }, []);

  const priceLabel = (plan: SubscriptionPlan) =>
    storePrices[plan] ?? FALLBACK_PRICES[plan];

  const handleSubscribe = async () => {
    if (!isIAPAvailable()) {
      Alert.alert(
        'Store Unavailable',
        'The app store is not reachable right now. Please check your connection and try again.',
      );
      return;
    }
    setPurchasing(true);
    try {
      await purchaseSubscription(selectedPlan);
      // Result arrives via purchaseUpdatedListener — setPurchasing(false) happens there
    } catch (err: any) {
      setPurchasing(false);
      if (err?.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Failed', err?.message ?? 'Something went wrong. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    if (!isIAPAvailable()) {
      Alert.alert('Store Unavailable', 'Cannot reach the app store right now. Please try again later.');
      return;
    }
    setRestoring(true);
    try {
      const restored = await restorePremiumPurchases();
      if (restored) {
        const updated = await getProfile();
        setProfile(updated);
        Alert.alert('Purchases Restored', 'Your Premium subscription has been restored!');
      } else {
        Alert.alert('Nothing to Restore', 'No previous purchases were found for this account.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  if (!profile) return null;

  const isPremium = profile.isPremiumMax;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.crownCircle} accessibilityLabel="Premium crown">
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <Text style={styles.heroTitle} accessibilityRole="header">ChesterClub Premium</Text>
          <Text style={styles.heroSubtitle}>
            {isPremium
              ? 'You have full access to all premium features!'
              : 'Unlock the full potential of ChesterClub'}
          </Text>
        </View>

        {/* Active badge */}
        {isPremium && (
          <View style={styles.activeBadge}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.activeBadgeText}>Premium Active</Text>
            {profile.subscription && (
              <Text style={styles.activePlanText}>
                {profile.subscription.plan === 'monthly' ? 'Monthly plan' : 'Yearly plan'}
              </Text>
            )}
          </View>
        )}

        {/* Plan selector (only show if not premium) */}
        {!isPremium && (
          <View style={styles.plans}>
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
              accessibilityRole="button"
              accessibilityLabel={`Monthly plan, ${priceLabel('monthly')}`}
              accessibilityState={{ selected: selectedPlan === 'monthly' }}
            >
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planPrice}>
                {storePrices.monthly
                  ? storePrices.monthly.replace('/mo', '')
                  : '$4.99'}
              </Text>
              <Text style={styles.planPeriod}>per month</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, styles.planCardBest, selectedPlan === 'yearly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('yearly')}
              accessibilityRole="button"
              accessibilityLabel={`Yearly plan, ${priceLabel('yearly')}, best value, save 50%`}
              accessibilityState={{ selected: selectedPlan === 'yearly' }}
            >
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>Best Value</Text>
              </View>
              <Text style={styles.planName}>Yearly</Text>
              <Text style={styles.planPrice}>
                {storePrices.yearly
                  ? storePrices.yearly.replace('/yr', '')
                  : '$29.99'}
              </Text>
              <Text style={styles.planPeriod}>per year</Text>
              <Text style={styles.planSaving}>Save 50%</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle} accessibilityRole="header">
            {isPremium ? 'Your Premium Features' : 'What You Get'}
          </Text>
          {FEATURES.map((feature, i) => (
            <View
              key={i}
              style={styles.featureRow}
              accessibilityLabel={`${feature.title}: ${feature.description}${feature.free ? '' : ', premium only'}`}
            >
              <View style={[styles.featureIcon, !feature.free && styles.featureIconPremium]}>
                <Ionicons name={feature.icon as any} size={20} color={feature.free ? Colors.secondary : '#FFD700'} />
              </View>
              <View style={styles.featureContent}>
                <View style={styles.featureHeader}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  {!feature.free && (
                    <View style={styles.premiumTag}>
                      <Text style={styles.premiumTagText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        {!isPremium && (
          <TouchableOpacity
            style={[styles.subscribeBtn, purchasing && styles.subscribeBtnDisabled]}
            onPress={handleSubscribe}
            disabled={purchasing}
            accessibilityRole="button"
            accessibilityLabel={`Start Premium, ${priceLabel(selectedPlan)}`}
            accessibilityState={{ disabled: purchasing }}
          >
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.subscribeBtnText}>
                Start Premium — {priceLabel(selectedPlan)}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
          accessibilityRole="button"
          accessibilityLabel="Restore Purchases"
        >
          {restoring ? (
            <ActivityIndicator color={Colors.textSecondary} size="small" />
          ) : (
            <Text style={styles.restoreBtnText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        {!isPremium && (
          <Text style={styles.legalText}>
            Subscription auto-renews. Cancel anytime in your device settings. By subscribing you agree to our Terms of Service and Privacy Policy.
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  backBtn: { marginBottom: Spacing.md },

  // Hero
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  crownCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  crownEmoji: { fontSize: 40 },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  heroSubtitle: {
    fontSize: FontSize.md, color: Colors.textSecondary,
    textAlign: 'center', marginTop: Spacing.xs, lineHeight: 22,
  },

  // Active badge
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.success + '15',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.success + '30',
    flexWrap: 'wrap',
  },
  activeBadgeText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.success },
  activePlanText: { fontSize: FontSize.sm, color: Colors.success + 'CC' },

  // Plans
  plans: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  planCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  planCardBest: { borderColor: '#FFD700' + '50' },
  planCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  bestBadge: {
    position: 'absolute', top: -10,
    backgroundColor: '#FFD700', paddingHorizontal: Spacing.sm,
    paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  bestBadgeText: { fontSize: 10, fontWeight: '800', color: '#5D4200' },
  planName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.xs },
  planPrice: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.xs },
  planPeriod: { fontSize: FontSize.xs, color: Colors.textSecondary },
  planSaving: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.success, marginTop: Spacing.xs },

  // Features
  featuresSection: { marginBottom: Spacing.xl },
  featuresTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.text,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.secondary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  featureIconPremium: { backgroundColor: '#FFD700' + '15' },
  featureContent: { flex: 1 },
  featureHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  featureDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 20 },
  premiumTag: {
    backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  premiumTagText: { fontSize: 9, fontWeight: '800', color: '#5D4200' },

  // CTA
  subscribeBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    minHeight: 56, justifyContent: 'center',
  },
  subscribeBtnDisabled: { opacity: 0.7 },
  subscribeBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
  restoreBtn: { alignItems: 'center', padding: Spacing.md, marginTop: Spacing.sm, minHeight: 44, justifyContent: 'center' },
  restoreBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  legalText: {
    fontSize: 10, color: Colors.textLight, textAlign: 'center',
    lineHeight: 16, marginTop: Spacing.md,
  },
});
