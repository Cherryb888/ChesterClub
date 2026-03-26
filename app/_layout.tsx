import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { isOnboardingComplete } from '../services/storage';
import { onAuthChange, isFirebaseConfigured } from '../services/firebase';
import { onUserSignIn, performFullSync } from '../services/firestore';

export default function RootLayout() {
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        // User just signed in — merge cloud data
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
