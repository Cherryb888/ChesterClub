import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { isOnboardingComplete, runMigrations, getSettings } from '../services/storage';
import { onAuthChange, isFirebaseConfigured } from '../services/firebase';
import { onUserSignIn, performFullSync } from '../services/firestore';
import { startConnectivityListener, stopConnectivityListener } from '../services/syncQueue';
import { initializeNotifications, rescheduleAll } from '../services/notifications';
import { registerPushToken, unregisterPushToken } from '../services/pushTokenService';

export default function RootLayout() {
  // Run data migrations on app start
  useEffect(() => {
    runMigrations().catch(console.error);
  }, []);

  // Initialize notifications and schedule based on settings
  useEffect(() => {
    (async () => {
      const granted = await initializeNotifications();
      if (granted) {
        const settings = await getSettings();
        await rescheduleAll(settings);
      }
    })().catch(console.error);
  }, []);

  // Start connectivity listener for offline sync queue
  useEffect(() => {
    startConnectivityListener();
    return () => stopConnectivityListener();
  }, []);

  // Wire Firebase auth listener for cloud sync
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        await onUserSignIn();
        registerPushToken().catch(console.error);
      } else {
        unregisterPushToken().catch(console.error);
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
