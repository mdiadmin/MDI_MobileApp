import { OneSignal, LogLevel } from 'react-native-onesignal';
import Constants from 'expo-constants';

const APP_ID = Constants.expoConfig?.extra?.oneSignalAppId as string | undefined;

function setupForegroundNotificationDisplay(): void {
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
    event.getNotification().display();
  });
}

// Registers the SDK only — does NOT prompt for the OS permission. The
// permission prompt is a single, explicit user action driven by the in-app
// soft-prompt in RootLayout (see services/PrayerNotifications.tsx), so this
// and the prayer-notification scheduler never race for the same OS dialog.
export function initializeOneSignal(): void {
  if (!APP_ID) {
    console.warn('OneSignal App ID is not configured. Skipping OneSignal initialization.');
    return;
  }

  OneSignal.Debug.setLogLevel(__DEV__ ? LogLevel.Verbose : LogLevel.None);
  OneSignal.initialize(APP_ID);
  setupForegroundNotificationDisplay();
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