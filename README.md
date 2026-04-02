# ChesterClub

AI-powered food scanner and macro tracker with Chester the Dog as your virtual companion.

## What's Built

| Feature | Status |
|---|---|
| AI Food Scanner (image, text, barcode) | ✅ Working |
| Daily Food Log with macro totals | ✅ Working |
| Chester virtual pet (levels, mood, streak, XP) | ✅ Working — single image asset (see below) |
| Dashboard (weekly charts, streaks, water) | ✅ Working |
| 8-step personalised onboarding + macro calc | ✅ Working |
| AI Meal Plans (7-day, personalised) | ✅ Working |
| Calendar view (past day meal history) | ✅ Working |
| Weight tracker with chart | ✅ Working |
| Nutrition Insights (weekly tips/trends) | ✅ Working |
| Daily Dig reward mechanic | ✅ Working |
| Challenges (daily/weekly/monthly/all-time) | ✅ Working |
| Coins & Shop (hats, accessories, titles, consumables) | ✅ Working — emoji icons, no visual asset previews |
| Badges & Achievements | ✅ Working |
| Favourite foods quick-log | ✅ Working |
| Firebase Auth (email, Google, Apple) | ✅ Working |
| Cloud sync (Firestore) with offline queue | ✅ Working |
| Local notifications (meal, water, streak) | ✅ Working |
| Friends (friend codes, list, leaderboard, feed) | ✅ Working — feed uses real-time `onSnapshot` listeners |
| Cloud Functions proxy (Gemini key server-side) | ✅ Built — needs deploying |
| Premium tier gating | ⚠️ Feature flags work, no in-app purchase SDK |
| Chester stage-specific images | ✅ Working — puppy/young use `chester-happy.png`; adult/champion/golden use `chester-solo.png` |
| Social interactions (likes/comments on feed) | ❌ Not planned |

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React Native + Expo SDK 55 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| AI | Google Gemini 2.0 Flash |
| Backend | Firebase (Firestore + Auth) |
| AI Proxy | Firebase Cloud Functions (3 endpoints) |
| Local Storage | AsyncStorage (offline-first) |
| Build | EAS Build |

## Project Structure

```
app/
  (tabs)/           # 5 main tab screens (scanner, log, home, meal-plan, calendar)
  (tabs)/...        # 15 hidden screens (dashboard, profile, weight, shop, badges, etc.)
  onboarding/       # 8-step onboarding flow
hooks/
  useScanner.ts     # Camera, barcode, AI analysis, food logging
  useAuth.ts        # Email, Google, Apple sign-in/up/out
services/
  gemini.ts         # Gemini calls — uses Cloud Functions if EXPO_PUBLIC_FUNCTIONS_URL is set,
                    # falls back to direct API (EXPO_PUBLIC_GEMINI_API_KEY) for local dev
  firebase.ts       # Auth only (sign in/up/out, Google, Apple)
  firestore.ts      # Cloud sync (profile, food log, water, challenges, settings)
  openfoodfacts.ts  # Barcode lookup
  insightsService.ts
  achievementChecker.ts
  chesterDialogue.ts
  notifications.ts
  syncQueue.ts      # Offline sync queue, retries on reconnect
  shopService.ts
  friendsService.ts
  feedService.ts
  favoritesService.ts
  storage/          # AsyncStorage split by domain (profile, foodLog, water, weight,
                    # chester, challenges, dailyDig, mealPlan, settings, migrations)
components/
  ui/               # ScreenHeader, Card, EmptyState, LoadingScreen
  chester/          # ChesterAvatar, ChesterFaceIcon, ChesterReaction, ChesterDigAnimation
  modals/           # AchievementUnlockedModal, StreakMilestoneModal, WeeklyRecap
functions/
  src/index.ts      # Cloud Functions: analyzeFoodImage, analyzeTextFood, generateMealPlan
```

## Screens Reference

| Screen | Route | Notes |
|---|---|---|
| Home / Dashboard | `/(tabs)/` | Chester, daily summary, water, challenges |
| Scanner | `/(tabs)/scanner` | Camera / text / barcode modes |
| Food Log | `/(tabs)/log` | Today grouped by meal type |
| Meal Plan | `/(tabs)/meal-plan` | AI-generated 7-day plan |
| Calendar | `/(tabs)/calendar` | Past day meal history |
| Dashboard (weekly) | `/(tabs)/dashboard` | Weekly stats + bar chart |
| Profile | `/(tabs)/profile` | Goals editor, display name |
| Weight | `/(tabs)/weight` | Weight history + line chart |
| Settings | `/(tabs)/settings` | Notifications, units, export, sync |
| Auth | `/(tabs)/auth` | Sign in/up, Google, Apple, sync |
| Badges | `/(tabs)/badges` | Achievement gallery |
| Shop | `/(tabs)/shop` | Cosmetics, consumables, coin balance |
| Favourites | `/(tabs)/favorites` | Saved foods, quick-log |
| Insights | `/(tabs)/insights` | Weekly tips/trends/alerts |
| Friends | `/(tabs)/friends` | Friend codes, add/remove friends |
| Leaderboard | `/(tabs)/leaderboard` | Streak/level/badges ranking |
| Feed | `/(tabs)/feed` | Friend activity (meals, milestones, achievements) |
| Daily Dig | `/(tabs)/daily-dig` | Daily reward animation |
| Premium | `/(tabs)/premium` | Feature showcase, upgrade prompt |

## Local Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your keys
4. `npx expo start`

> **Note:** Expo Go does not support SDK 55. Use EAS Build for device testing.

## Environment Variables

Copy `.env.example` to `.env`. All variables:

```bash
# Gemini — only needed locally without Cloud Functions deployed.
# Remove once Cloud Functions are live (key lives server-side).
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here

# Firebase — from Firebase console > Project Settings
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Sign-In — Web OAuth Client ID from Google Cloud Console.
# Firebase Console > Authentication > Sign-in method > Google > Web client ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Cloud Functions URL — set this after deploying functions/ to Firebase.
# Format: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net
# When set, Gemini calls route through the proxy (EXPO_PUBLIC_GEMINI_API_KEY not needed).
# When empty, app calls Gemini directly (EXPO_PUBLIC_GEMINI_API_KEY required).
EXPO_PUBLIC_FUNCTIONS_URL=
```

**Key sources:**
- Gemini API (free): https://aistudio.google.com/apikey
- Firebase config: https://console.firebase.google.com > Project Settings > Your apps
- Google client ID: Firebase Console > Authentication > Sign-in method > Google > Web client ID

## Cloud Functions (AI Proxy)

The `functions/` directory contains 3 Firebase Cloud Functions that proxy Gemini calls server-side (keeps API key off the client):

| Endpoint | Description |
|---|---|
| `analyzeFoodImage` | Accepts base64 image, returns foods array + Chester reaction |
| `analyzeTextFood` | Accepts text description, returns same structure |
| `generateMealPlan` | Accepts goals + diet profile, returns 7-day meal plan |

All endpoints require Firebase Auth token, are rate-limited (10 req/min/user), and include input validation.

**To deploy:**
```bash
cd functions
npm install
firebase deploy --only functions
```

Then set `EXPO_PUBLIC_FUNCTIONS_URL` in `.env` to the deployed base URL and rebuild the app.

## EAS Build

```bash
npm install -g eas-cli
eas login

# Android preview APK
eas build --platform android --profile preview

# Production
eas build --platform android --profile production
eas build --platform ios --profile production
```

`app.json` already has `bundleIdentifier: com.chesterclub.app` and `package: com.chesterclub.app` set.

## Firebase Setup

1. Create project at https://console.firebase.google.com
2. Enable **Authentication** — Email/Password, Google, Apple
3. Enable **Firestore Database** (start in test mode, then add security rules before release)
4. Fill in `.env` from Project Settings > Your apps
5. Enable Google Sign-In and copy the Web client ID to `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

## What's Left Before Release

### Must-Do
- [ ] Deploy Cloud Functions and set `EXPO_PUBLIC_FUNCTIONS_URL` (removes Gemini key from client)
- [x] Write Firestore security rules — `firestore.rules` created, deploy with `firebase deploy --only firestore:rules`
- [x] Add Chester stage-specific image assets — puppy/young use `chester-happy.png`; adult/champion/golden use `chester-solo.png`. `ChesterAvatar` uses a `STAGE_IMAGES` map so swapping in dedicated per-stage images later requires only adding the files and updating the map.
- [ ] In-app purchases for Premium tier (StoreKit on iOS, Play Billing on Android) — gating logic is in place, just needs payment SDK wired up
- [x] Privacy Policy screen — `app/(tabs)/privacy-policy.tsx`, linked from Settings > About. Fill in `CONTROLLER_NAME`, `CONTROLLER_EMAIL`, `CONTROLLER_COUNTRY` at the top of the file before publishing.

### Should-Do
- [ ] Shop item visual previews (currently emoji icons — ideally small images per cosmetic)
- [x] Real-time friend feed — uses `onSnapshot` per-user listeners; feed updates live without manual refresh
- [ ] Push notification setup via EAS / FCM (notification scheduling is implemented locally; cloud delivery not configured)
- [ ] TypeScript clean-up: `npx tsc --noEmit`

### Store Submission
- [ ] Apple Developer Program ($99/year) — https://developer.apple.com/programs/
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios`
- [ ] Google Play Developer account ($25 one-time) — https://play.google.com/console
- [ ] `eas build --platform android --profile production`
- [ ] `eas submit --platform android`

## Architecture Notes

- **Offline-first** — all data written to AsyncStorage immediately; Firestore sync runs in background via `syncQueue.ts`, which retries on reconnect
- **AI dual-mode** — `gemini.ts` checks `EXPO_PUBLIC_FUNCTIONS_URL` at runtime; if set, routes through Cloud Functions with Firebase auth token; if empty, falls back to direct Gemini API
- **Domain-split storage** — `services/storage/` has 9 focused modules; `services/storage/index.ts` re-exports everything so existing imports don't break
- **Custom hooks** — `useScanner.ts` and `useAuth.ts` own all logic; screen files are render-only
- **Graceful degradation** — Firebase and Gemini both degrade cleanly if env vars are missing (app remains usable offline)
