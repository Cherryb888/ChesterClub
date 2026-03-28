# ChesterClub

AI-powered food scanner and macro tracker with Chester the Dog as your virtual companion.

## What It Does

- **AI Food Scanner** — photograph any meal, Gemini AI identifies food and estimates calories/macros
- **Barcode Scanner** — scan packaged food barcodes for instant nutrition data
- **Text Food Search** — type what you ate for quick logging
- **Chester the Dog** — virtual pet companion that grows, reacts to your meals, and motivates you
- **Daily Food Log** — track everything you eat with running macro totals
- **Dashboard** — weekly charts, streaks, water tracking, and Chester's stats
- **Meal Plans** — AI-generated personalised weekly meal plans
- **Insights** — weekly nutrition analysis and tips
- **Weight Tracker** — log and chart your weight over time
- **Challenges** — daily, weekly, monthly and all-time challenges with coin rewards
- **Shop** — spend coins on Chester items and power-ups
- **Badges & Leaderboard** — achievements and social ranking
- **Onboarding** — 8-step personalised setup (goals, diet type, allergies, cooking preferences)
- **Auth** — email/password, Google Sign-In, Apple Sign-In

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React Native + Expo SDK 55 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| AI | Google Gemini API |
| Backend | Firebase (Firestore + Auth) |
| Local Storage | AsyncStorage (offline-first) |
| Build | EAS Build |

## Project Structure

```
app/
  (tabs)/         # All main screens (scanner, log, dashboard, etc.)
  onboarding/     # 8-step onboarding flow + step components
hooks/
  useScanner.ts   # All scanner logic (camera, barcode, AI analysis)
  useAuth.ts      # All auth logic (email, Google, Apple)
services/
  gemini.ts       # Gemini AI API calls
  insightsService.ts
  storage/        # Domain-split AsyncStorage modules
    profileStorage.ts
    chesterStorage.ts
    foodLogStorage.ts
    waterStorage.ts
    mealPlanStorage.ts
    weightStorage.ts
    challengesStorage.ts
    settingsStorage.ts
    migrations.ts
components/ui/    # Reusable UI components
utils/
  nutrition.ts    # Nutrition calculations
```

## Local Setup

1. Clone the repo
2. Run `npm install`
3. Create a `.env` file in the project root (see below)
4. Run `npx expo start`

> **Note:** Expo Go does not support SDK 55. Use EAS Build for device testing (see below).

## Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Get keys from:
- **Gemini API** (free): https://aistudio.google.com/apikey
- **Firebase** (free): https://console.firebase.google.com

## Building for Device Testing (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

The build runs on Expo's cloud servers — no Mac required for Android. When complete, scan the QR code on expo.dev to install the `.apk` on your device.

For iOS distribution you will need an Apple Developer account ($99/year).

## Road to Release Checklist

### Before Submission
- [ ] Move Gemini API key to a Cloud Functions proxy (key should not be in the client app)
- [ ] Set up Firebase Security Rules (Firestore + Storage)
- [ ] Add push notification handling for streak reminders and Chester alerts
- [ ] Privacy Policy page (required by both stores)
- [ ] Final app icon and splash screen assets
- [ ] Test all flows on a real device via EAS Build
- [ ] Fix any TypeScript errors (`npx tsc --noEmit`)

### Apple App Store (iOS)
- [ ] Apple Developer Program ($99/year) — https://developer.apple.com/programs/
- [ ] Set `bundleIdentifier` in app.json
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios`

### Google Play Store (Android)
- [ ] Google Play Developer account ($25 one-time) — https://play.google.com/console
- [ ] Set `package` name in app.json
- [ ] `eas build --platform android --profile production`
- [ ] `eas submit --platform android`

### app.json Values to Set Before Release
```json
{
  "name": "ChesterClub",
  "slug": "chesterclub",
  "version": "1.0.0",
  "ios": { "bundleIdentifier": "com.yourname.chesterclub" },
  "android": { "package": "com.yourname.chesterclub" }
}
```

## Firebase Setup

1. Create a project at https://console.firebase.google.com
2. Enable **Authentication** — Email/Password, Google, Apple
3. Enable **Firestore Database**
4. Add your config values to `.env`

## Key Design Decisions

- **Offline-first** — all data lives in AsyncStorage, Firebase syncs in the background
- **Domain-split storage** — `services/storage.ts` split into 9 focused modules, all existing imports still work via barrel re-export
- **Custom hooks** — scanner and auth logic extracted to `hooks/` to keep screen files render-only
- **No behaviour changes during refactor** — all refactoring phases preserved existing functionality exactly
