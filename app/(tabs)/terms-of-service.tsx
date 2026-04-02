// ─── Terms of Service Screen ──────────────────────────────────────────────────
//
// BEFORE PUBLISHING: Replace every instance of:
//   [YOUR NAME / COMPANY]  — your legal name or company name
//   [YOUR EMAIL ADDRESS]   — your support/legal contact email
//   [YOUR COUNTRY]         — country of incorporation / residence
//
// These Terms cover App Store and Google Play requirements including:
//   • Acceptable use
//   • AI-generated content disclaimer
//   • Virtual currency (coins) and premium features
//   • Account termination
//   • Limitation of liability
// ──────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import ScreenHeader from '../../components/ui/ScreenHeader';

const LAST_UPDATED = '1 April 2025';
// Replace with your real details before publishing:
const OPERATOR_NAME = '[YOUR NAME / COMPANY]';
const OPERATOR_EMAIL = '[YOUR EMAIL ADDRESS]';
const OPERATOR_COUNTRY = '[YOUR COUNTRY]';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Terms of Service" />

        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Section title="1. Acceptance of Terms">
          <P>By downloading, installing, or using ChesterClub ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the App.</P>
          <P>These Terms form a legal agreement between you and {OPERATOR_NAME} ("we", "us", "our"), a business operating from {OPERATOR_COUNTRY}. Contact: {OPERATOR_EMAIL}</P>
        </Section>

        <Section title="2. Description of Service">
          <P>ChesterClub is a food tracking and nutrition app featuring an AI-powered food scanner, macro tracking, meal planning, and Chester — a virtual dog companion whose wellbeing reflects your nutrition habits.</P>
          <P>The App includes free and premium features. Premium features require an active subscription or one-time purchase.</P>
        </Section>

        <Section title="3. Eligibility">
          <P>You must be at least 13 years old to use ChesterClub. If you are under 18, you confirm that a parent or guardian has consented to these Terms on your behalf.</P>
        </Section>

        <Section title="4. User Accounts">
          <P>You may use the App without an account. Creating an account enables cloud sync, social features, and cross-device access.</P>
          <P>You are responsible for keeping your account credentials secure and for all activity that occurs under your account. Notify us immediately at {OPERATOR_EMAIL} if you suspect unauthorised access.</P>
          <P>You may delete your account at any time from Settings → Delete Account. Upon deletion, your account and associated data will be permanently removed.</P>
        </Section>

        <Section title="5. AI-Generated Content">
          <P>ChesterClub uses Google Gemini to analyse food images, estimate nutritional values, and generate meal plans. AI-generated nutritional information is an estimate only and may not be accurate.</P>
          <P>This App is not a medical device and does not provide medical, dietary, or clinical nutrition advice. Always consult a qualified healthcare professional or registered dietitian before making significant dietary changes, especially if you have a medical condition.</P>
          <P>We are not liable for any harm resulting from reliance on AI-generated nutritional estimates.</P>
        </Section>

        <Section title="6. Virtual Currency and Premium Features">
          <P>The App includes a virtual in-app currency ("Coins") earned through normal use. Coins have no real-world monetary value, cannot be transferred between users, and cannot be exchanged for cash or real goods.</P>
          <P>Premium features may be unlocked via in-app purchase. All purchases are processed by Apple App Store or Google Play Store and are subject to their respective terms. We do not store payment card details.</P>
          <P>Purchases are non-refundable except as required by applicable law or the platform's refund policy. Contact Apple or Google directly for refund requests.</P>
        </Section>

        <Section title="7. Acceptable Use">
          <P>You agree not to:</P>
          <P>• Use the App for any unlawful purpose or in violation of any applicable law</P>
          <P>• Attempt to reverse-engineer, decompile, or extract the App's source code</P>
          <P>• Use automated tools to scrape, harvest, or abuse the App's AI features</P>
          <P>• Post or transmit content that is defamatory, harassing, or harmful to others</P>
          <P>• Attempt to gain unauthorised access to other users' accounts or data</P>
          <P>• Interfere with or disrupt the App's infrastructure or servers</P>
        </Section>

        <Section title="8. Social Features">
          <P>ChesterClub includes social features (friends list, activity feed, leaderboard). You are responsible for the content you share. We reserve the right to remove content or suspend accounts that violate these Terms.</P>
          <P>Friend activity data (meal logs, achievements, milestones) shared via the feed is visible to your friends only. You control what you share.</P>
        </Section>

        <Section title="9. Intellectual Property">
          <P>All content in the App — including Chester artwork, UI design, copy, and code — is owned by or licensed to {OPERATOR_NAME}. You may not reproduce, distribute, or create derivative works without our written permission.</P>
          <P>You retain ownership of the food and health data you enter. By syncing data to our servers, you grant us a limited licence to store and process it solely to provide the App's services.</P>
        </Section>

        <Section title="10. Privacy">
          <P>Your use of the App is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please read it carefully. You can find it in Settings → Privacy Policy.</P>
        </Section>

        <Section title="11. Disclaimers">
          <P>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT NUTRITIONAL ESTIMATES WILL BE ACCURATE.</P>
        </Section>

        <Section title="12. Limitation of Liability">
          <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {OPERATOR_NAME.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.</P>
          <P>Our total liability to you for any claim arising from these Terms or your use of the App shall not exceed the amount you paid us in the 12 months preceding the claim, or £10 (GBP), whichever is greater.</P>
          <P>Nothing in these Terms limits our liability for death, personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.</P>
        </Section>

        <Section title="13. Termination">
          <P>We may suspend or terminate your access to the App if you breach these Terms, with or without notice. Upon termination, your right to use the App ceases immediately.</P>
          <P>You may stop using the App at any time. Deleting your account removes your data as described in the Privacy Policy.</P>
        </Section>

        <Section title="14. Changes to These Terms">
          <P>We may update these Terms from time to time. We will notify you of material changes via an in-app notice or email. Continued use of the App after changes take effect constitutes acceptance of the revised Terms.</P>
        </Section>

        <Section title="15. Governing Law">
          <P>These Terms are governed by the laws of {OPERATOR_COUNTRY}. Any disputes shall be subject to the exclusive jurisdiction of the courts of {OPERATOR_COUNTRY}, except where local consumer protection law provides otherwise.</P>
        </Section>

        <Section title="16. Contact">
          <P>Questions about these Terms? Contact us at:</P>
          <P style={styles.contactDetail}>{OPERATOR_NAME}</P>
          <P style={styles.contactDetail}>{OPERATOR_EMAIL}</P>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  updated: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  contactDetail: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
});
