# ChesterClub

AI-powered food scanner & macro tracker app with Chester the Dog as your virtual companion.

## Features

- **AI Food Scanner** - Snap a photo of any meal, AI identifies food and estimates calories/macros
- **Text Food Search** - Type what you ate for quick logging
- **Chester the Dog** - Virtual pet companion that reacts to your meals and grows with you
- **Daily Food Log** - Track everything you eat with running macro totals
- **Dashboard** - Weekly charts, streaks, and Chester's stats
- **Profile & Goals** - Set and edit daily calorie/macro targets

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your API keys
3. Run `npm install`
4. Run `npx expo start`
5. Scan QR code with Expo Go app on your phone

## API Keys Needed

- **Google Gemini API** (free): https://aistudio.google.com/apikey
- **Firebase** (free): https://console.firebase.google.com

## Tech Stack

- React Native + Expo
- TypeScript
- Google Gemini API (food recognition)
- Firebase (auth + storage)
- AsyncStorage (local data)
