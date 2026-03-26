import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { isOnboardingComplete, runMigrations } from '../services/storage';
import { onAuthChange, isFirebaseConfigured } from '../services/firebase';
import { onUserSignIn, performFullSync } from '../services/firestore';

export default function RootLayout() {
  // Run data migrations on app start
  useEffect(() => {
    runMigrations().catch(console.error);
  }, []);

  // Wire Firebase auth listener for cloud sync
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        await onUserSignIn();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" options={{ animation: 'fade' }} />
        <Stack.Screen name="scan-result" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
