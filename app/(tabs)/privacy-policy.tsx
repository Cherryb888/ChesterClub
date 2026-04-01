// ─── Privacy Policy Screen ────────────────────────────────────────────────────
//
// BEFORE PUBLISHING: Replace every instance of [YOUR NAME / COMPANY],
// [YOUR EMAIL ADDRESS], and [YOUR COUNTRY] with your real details.
// Also confirm the Firebase storage region for your project in the Firebase
// Console (Project Settings > General) and update the transfer section if needed.
//
// This policy covers:
//   • UK GDPR (UK Data Protection Act 2018) — required for UK App Store listing
//   • EU GDPR — required for EU users
//   • CCPA — required for California users
//   • App Store & Google Play privacy policy requirements
// ──────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import ScreenHeader from '../../components/ui/ScreenHeader';

const LAST_UPDATED = '1 April 2025';
// Replace with your real contact details before publishing:
const CONTROLLER_NAME = '[YOUR NAME / COMPANY]';
const CONTROLLER_EMAIL = '[YOUR EMAIL ADDRESS]';
const CONTROLLER_COUNTRY = '[YOUR COUNTRY]';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Privacy Policy" />

        <Text style={styles.meta}>Last updated: {LAST_UPDATED}</Text>

        <Section title="Who We Are">
          <Body>
            ChesterClub is operated by {CONTROLLER_NAME}, based in {CONTROLLER_COUNTRY}{' '}
            (the "Data Controller"). We are responsible for the personal data you provide
            when using this app.
          </Body>
          <Body>Contact: {CONTROLLER_EMAIL}</Body>
        </Section>

        <Section title="What Data We Collect">
          <SubHeading>Account data</SubHeading>
          <Body>
            If you create an account: your email address and display name. These are
            stored by Google Firebase Authentication. You may also sign in via Google
            or Apple, in which case we receive only your email and display name from
            those providers — no other account data.
          </Body>

          <SubHeading>Health and body data</SubHeading>
          <Body>
            During onboarding and normal use you may enter: age, height, current weight,
            target weight, fitness goal, activity level, diet type, allergies, and
            daily calorie and macro targets. This is health-related data. We process
            it only to provide the core calorie and nutrition tracking service.
          </Body>

          <SubHeading>Food logs and water intake</SubHeading>
          <Body>
            Every food item you log (name, calories, protein, carbs, fat, meal type,
            date) and daily water intake are stored locally on your device in AsyncStorage.
            If you sign in and enable cloud sync, this data is also stored in Google
            Firestore linked to your account.
          </Body>

          <SubHeading>Food photos and text descriptions</SubHeading>
          <Body>
            When you scan a meal using the camera or describe food in text, that image
            or text is sent to the Google Gemini AI API for analysis. We receive back
            a list of identified foods with estimated nutrition. The image or text is
            not stored by us after analysis. Google may process this data in accordance
            with its own privacy terms; see google.com/policies/privacy.
          </Body>

          <SubHeading>Weight history</SubHeading>
          <Body>
            Weight entries (date, value, unit) you log in the weight tracker are stored
            locally and optionally synced to Firestore.
          </Body>

          <SubHeading>App activity and Chester progress</SubHeading>
          <Body>
            Chester's level, XP, streak, mood, coins, achievements, equipped items,
            and challenge progress are stored locally and optionally synced to Firestore.
          </Body>

          <SubHeading>Social data (optional)</SubHeading>
          <Body>
            If you use the social features you will have a friend code. Your display
            name, Chester level, streak, mood, and achievement count are published to
            a public profile visible to your friends. Activity feed posts (meals logged,
            streak milestones, achievements, level-ups) are visible to users you add
            as friends.
          </Body>

          <SubHeading>Notification preferences</SubHeading>
          <Body>
            Your choices about meal, water, and streak notifications are stored locally
            and optionally synced to Firestore. Local notifications are delivered by
            your device's operating system; no notification content is sent to our servers.
          </Body>
        </Section>

        <Section title="Lawful Basis for Processing (UK & EU GDPR)">
          <Body>
            We process your personal data on the following legal bases:
          </Body>
          <BulletList items={[
            'Contract — processing your account data, food logs, and body stats is necessary to provide the service you signed up for.',
            'Consent — we rely on your consent to process health data (body stats, food logs) and to send push notifications. You can withdraw consent at any time by deleting your data in Settings or disabling notifications in the app.',
            'Legitimate interests — we have a legitimate interest in keeping the app secure and stable. This includes basic diagnostics if the app crashes.',
          ]} />
          <Body>
            Health data (body stats, food logs) is a special category under UK/EU GDPR.
            We process it only on the basis of your explicit consent and only for the
            purpose of providing the nutrition tracking service to you.
          </Body>
        </Section>

        <Section title="Third-Party Services">
          <Body>We use the following third-party processors:</Body>
          <BulletList items={[
            'Google Firebase (Authentication & Firestore) — stores your account data and synced app data. Data may be stored on Google servers in the US or EU. Google maintains Standard Contractual Clauses (SCCs) for international transfers. See firebase.google.com/support/privacy.',
            'Google Gemini AI — analyses food photos and text descriptions you submit. Google acts as a data processor. Images are not retained by us after analysis. See ai.google.dev/gemini-api/terms.',
            'OpenFoodFacts — barcode lookups. Only the barcode number is sent; no personal data. OpenFoodFacts is an open database with no account requirement.',
            'Expo / EAS — used to build and deliver app updates. Expo does not receive your personal data. See expo.dev/privacy.',
            'Apple Sign-In / Google Sign-In (optional) — if used, these providers share only your email and display name with us under their own privacy terms.',
          ]} />
        </Section>

        <Section title="International Data Transfers">
          <Body>
            If you are based in the UK or EU, your data may be transferred to Google
            servers in the United States when you use cloud sync or the AI scanner.
            Google has implemented Standard Contractual Clauses (SCCs) approved by the
            UK ICO and the European Commission to ensure your data is protected to an
            equivalent standard. You can opt out of cloud sync by not creating an account
            or by using the app in offline mode.
          </Body>
        </Section>

        <Section title="How Long We Keep Your Data">
          <BulletList items={[
            'Account data — kept until you delete your account via Firebase Authentication.',
            'Food logs, weight, body stats — kept until you use "Clear All Data" in Settings or request deletion.',
            'Food photos — never stored. Discarded immediately after AI analysis.',
            'Social / public profile data — kept until you remove friends, clear data, or request deletion.',
            'Local-only data (no account) — kept on your device until you uninstall the app or use "Clear All Data" in Settings.',
          ]} />
        </Section>

        <Section title="Your Rights">
          <Body>
            Under UK GDPR (and EU GDPR for EU residents) you have the following rights:
          </Body>
          <BulletList items={[
            'Right to access — request a copy of the personal data we hold about you.',
            'Right to rectification — ask us to correct inaccurate data.',
            'Right to erasure — ask us to delete your data ("right to be forgotten").',
            'Right to restriction — ask us to pause processing while a dispute is resolved.',
            'Right to data portability — receive your data in a machine-readable format. Use "Export Data" in Settings for an immediate JSON export.',
            'Right to object — object to processing based on legitimate interests.',
            'Right to withdraw consent — you can withdraw consent for health data processing or notifications at any time. Withdrawal does not affect processing already done.',
          ]} />
          <Body>
            To exercise any right, contact us at {CONTROLLER_EMAIL}. We will respond
            within 30 days.
          </Body>

          <SubHeading>UK residents — right to complain</SubHeading>
          <Body>
            If you are unhappy with how we handle your data you have the right to lodge
            a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk
            or by calling 0303 123 1113.
          </Body>

          <SubHeading>EU residents — right to complain</SubHeading>
          <Body>
            EU residents may complain to the data protection authority in their member
            state.
          </Body>
        </Section>

        <Section title="California Residents (CCPA)">
          <Body>
            If you are a California resident, the California Consumer Privacy Act (CCPA)
            gives you additional rights:
          </Body>
          <BulletList items={[
            'Right to know what personal data we collect, use, and share.',
            'Right to delete your personal data.',
            'Right to opt out of the sale of personal data. We do not sell your personal data.',
            'Right to non-discrimination for exercising your rights.',
          ]} />
          <Body>
            To make a request under CCPA, contact {CONTROLLER_EMAIL}.
          </Body>
        </Section>

        <Section title="Children">
          <Body>
            ChesterClub is intended for users aged 13 and over. We do not knowingly
            collect personal data from children under 13. If you believe a child under
            13 has provided us with personal data, please contact us and we will delete
            it promptly.
          </Body>
          <Body>
            Users under 18 in the UK and EU should obtain parental consent before
            using social features or cloud sync.
          </Body>
        </Section>

        <Section title="Cookies and Tracking">
          <Body>
            ChesterClub is a mobile app and does not use browser cookies. We do not
            use any cross-app advertising trackers or analytics SDKs.
          </Body>
        </Section>

        <Section title="Changes to This Policy">
          <Body>
            We may update this policy when the app adds new features that affect how
            data is processed. We will update the "Last updated" date at the top of
            this page. For material changes we will notify you via an in-app notice.
          </Body>
        </Section>

        <Section title="Contact">
          <Body>
            For any privacy questions or rights requests:{'\n'}
            {CONTROLLER_NAME}{'\n'}
            {CONTROLLER_EMAIL}
          </Body>
        </Section>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Local helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subHeading}>{children}</Text>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },

  meta: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },

  section: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: Spacing.sm,
  },

  subHeading: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  body: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  bulletList: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm },
  bullet: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
