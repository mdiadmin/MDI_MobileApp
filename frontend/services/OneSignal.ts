// Add soft prompting, test adhan notifications, add ios notifications and then slowly move everything to live site, change functions.php, change url in Announcements.tsx

import { OneSignal, LogLevel } from 'react-native-onesignal';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_ID = Constants.expoConfig?.extra?.oneSignalAppId as string | undefined;

// Tracks whether we've already asked for push permission once, so we only
// auto-prompt on first boot and never repeat the OS permission dialog on
// every launch.
const PERMISSION_REQUESTED_KEY = '@onesignal_permission_requested';

async function requestPermissionOnFirstBoot(): Promise<void> {
  try {
    const alreadyRequested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);
    if (alreadyRequested === 'true') return;

    await OneSignal.Notifications.requestPermission(true);
    await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
  } catch {
    // best-effort — if this fails we simply won't have auto-prompted;
    // the user can still enable notifications later from Settings.
  }
}

function setupForegroundNotificationDisplay(): void {
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
    event.getNotification().display();
  });
}

export function initializeOneSignal(): void {
  if (!APP_ID) {
    console.warn('OneSignal App ID is not configured. Skipping OneSignal initialization.');
    return;
  }

  OneSignal.Debug.setLogLevel(__DEV__ ? LogLevel.Verbose : LogLevel.None);
  OneSignal.initialize(APP_ID);
  setupForegroundNotificationDisplay();
  requestPermissionOnFirstBoot();
}

export function loginOneSignal(externalId: string): void {
  OneSignal.login(externalId);
}

export function logoutOneSignal(): void {
  OneSignal.logout();
}

export function addOneSignalTag(key: string, value: string): void {
  OneSignal.User.addTag(key, value);
}

export function removeOneSignalTag(key: string): void {
  OneSignal.User.removeTag(key);
}

export function addOneSignalEmail(email: string): void {
  OneSignal.User.addEmail(email);
}

export function removeOneSignalEmail(email: string): void {
  OneSignal.User.removeEmail(email);
}

export function addOneSignalSms(phoneNumber: string): void {
  OneSignal.User.addSms(phoneNumber);
}

export function removeOneSignalSms(phoneNumber: string): void {
  OneSignal.User.removeSms(phoneNumber);
}

export async function requestOneSignalPermission(): Promise<boolean> {
  return OneSignal.Notifications.requestPermission(true);
}

export async function hasOneSignalPermission(): Promise<boolean> {
  return OneSignal.Notifications.hasPermission();
}