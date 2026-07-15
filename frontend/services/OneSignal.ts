import { Alert } from 'react-native';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import Constants from 'expo-constants';

const APP_ID = Constants.expoConfig?.extra?.oneSignalAppId as string | undefined;

let dialogShown = false;

function isRegistered(subscriptionId: string | null | undefined): boolean {
  return !!subscriptionId && !subscriptionId.startsWith('local-');
}

function maybeShowIntegrationCompleteDialog(subscriptionId: string | null | undefined): void {
  if (isRegistered(subscriptionId) && !dialogShown) {
    dialogShown = true;
    showIntegrationCompleteDialog();
  }
}

function showIntegrationCompleteDialog(): void {
  Alert.alert(
    'Your OneSignal SDK integration is complete!',
    'You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.',
    [
      {
        text: 'Got it',
        onPress: () => {
          OneSignal.Notifications.requestPermission(true);
        },
      },
    ],
    { cancelable: false }
  );
}

function setupPushSubscriptionObserver(): void {
  OneSignal.User.pushSubscription.addEventListener('change', (subscription) => {
    maybeShowIntegrationCompleteDialog(subscription.current.id);
  });

  // The ID may already be assigned before the listener attaches,
  // so evaluate the current value immediately as well.
  OneSignal.User.pushSubscription.getIdAsync().then(maybeShowIntegrationCompleteDialog);
}

/**
 * Initialize the OneSignal SDK. Call once from the root layout before
 * rendering the main app content.
 */
export function initializeOneSignal(): void {
  if (!APP_ID) {
    console.warn('OneSignal App ID is not configured. Skipping OneSignal initialization.');
    return;
  }

  OneSignal.Debug.setLogLevel(__DEV__ ? LogLevel.Verbose : LogLevel.None);
  OneSignal.initialize(APP_ID);
  setupPushSubscriptionObserver();
}

// -------------------------------------------------------------------------
// Centralized wrappers for all OneSignal SDK interactions. No direct SDK
// calls should be made outside this module.
// -------------------------------------------------------------------------

/** Identify the current user to OneSignal by an external ID. */
export function loginOneSignal(externalId: string): void {
  OneSignal.login(externalId);
}

/** Stop identifying the current user. */
export function logoutOneSignal(): void {
  OneSignal.logout();
}

/** Add a tag for the current user. */
export function addOneSignalTag(key: string, value: string): void {
  OneSignal.User.addTag(key, value);
}

/** Remove a tag from the current user. */
export function removeOneSignalTag(key: string): void {
  OneSignal.User.removeTag(key);
}

/** Add an email subscription for the current user. */
export function addOneSignalEmail(email: string): void {
  OneSignal.User.addEmail(email);
}

/** Remove an email subscription for the current user. */
export function removeOneSignalEmail(email: string): void {
  OneSignal.User.removeEmail(email);
}

/** Add an SMS subscription for the current user. */
export function addOneSignalSms(phoneNumber: string): void {
  OneSignal.User.addSms(phoneNumber);
}

/** Remove an SMS subscription for the current user. */
export function removeOneSignalSms(phoneNumber: string): void {
  OneSignal.User.removeSms(phoneNumber);
}

/**
 * Request push notification permission through OneSignal.
 * This is exposed for explicit call sites; the SDK integration dialog already
 * requests permission when the user taps "Got it".
 */
export async function requestOneSignalPermission(): Promise<boolean> {
  return OneSignal.Notifications.requestPermission(true);
}
