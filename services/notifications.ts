import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AppSettings } from './storage';

// ─── Notification Service ───
//
// Handles local notification scheduling for meal reminders,
// water reminders, and streak warnings. All notifications
// are Chester-themed for personality.

// ─── Setup ───

export async function initializeNotifications(): Promise<boolean> {
  // Set notification handler for foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Create Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// ─── Scheduling Helpers ───

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

// ─── Meal Reminders ───

const MEAL_MESSAGES = {
  breakfast: [
    "Good morning! Chester says it's breakfast time!",
    "Rise and shine! Don't forget to fuel up and log it!",
    "Chester's hungry for breakfast data! Time to eat!",
  ],
  lunch: [
    "Lunchtime! Chester's reminding you to eat and log!",
    "Midday fuel up! Don't forget to scan your lunch!",
    "Chester says: lunch break! Log what you eat!",
  ],
  dinner: [
    "Dinner time! Chester's waiting to see what you eat!",
    "Evening meal time! Don't forget to log dinner!",
    "Chester's dinner bell is ringing! Time to eat and track!",
  ],
};

async function scheduleMealReminders(settings: AppSettings): Promise<void> {
  // Cancel existing meal reminders
  await cancelNotificationsByPrefix('meal_');

  if (!settings.mealReminders) return;

  const meals = ['breakfast', 'lunch', 'dinner'] as const;

  for (const meal of meals) {
    const { hour, minute } = parseTime(settings.reminderTimes[meal]);
    const messages = MEAL_MESSAGES[meal];
    const message = messages[Math.floor(Math.random() * messages.length)];

    await Notifications.scheduleNotificationAsync({
      identifier: `meal_${meal}`,
      content: {
        title: `${meal.charAt(0).toUpperCase() + meal.slice(1)} Time!`,
        body: message,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

// ─── Water Reminders ───

const WATER_MESSAGES = [
  "Drink up! Chester says stay hydrated!",
  "Water break! Your body and Chester will thank you!",
  "Hydration check! Have you had a glass of water?",
  "Chester's bringing you a water bowl! Time to drink!",
  "Glug glug! Don't forget your water!",
];

async function scheduleWaterReminders(settings: AppSettings): Promise<void> {
  await cancelNotificationsByPrefix('water_');

  if (!settings.waterReminders) return;

  // Schedule 4x daily: 9am, 12pm, 3pm, 7pm
  const waterHours = [9, 12, 15, 19];

  for (const hour of waterHours) {
    const message = WATER_MESSAGES[Math.floor(Math.random() * WATER_MESSAGES.length)];

    await Notifications.scheduleNotificationAsync({
      identifier: `water_${hour}`,
      content: {
        title: 'Water Reminder 💧',
        body: message,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  }
}

// ─── Streak Warning ───

const STREAK_MESSAGES = [
  "Your streak is in danger! Log some food before midnight!",
  "Chester's worried! Don't let your streak break!",
  "Quick! Log a meal to keep your streak alive!",
  "Streak alert! Chester doesn't want to lose progress!",
  "Don't forget! Your streak needs you today!",
];

async function scheduleStreakWarning(settings: AppSettings): Promise<void> {
  await cancelNotificationsByPrefix('streak_');

  if (!settings.streakWarnings) return;

  const message = STREAK_MESSAGES[Math.floor(Math.random() * STREAK_MESSAGES.length)];

  // Send at 8pm if no food logged today
  await Notifications.scheduleNotificationAsync({
    identifier: 'streak_warning',
    content: {
      title: 'Streak Warning! 🔥',
      body: message,
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

// ─── Cancel Helpers ───

async function cancelNotificationsByPrefix(prefix: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier.startsWith(prefix)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Main Reschedule Function ───
//
// Called whenever settings change or on app startup.
// Cancels all existing and reschedules based on current settings.

export async function rescheduleAll(settings: AppSettings): Promise<void> {
  await scheduleMealReminders(settings);
  await scheduleWaterReminders(settings);
  await scheduleStreakWarning(settings);
}

// ─── Instant Notification ───
//
// For achievement unlocks or other immediate notifications.

export async function sendInstantNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
    trigger: null, // immediate
  });
}
