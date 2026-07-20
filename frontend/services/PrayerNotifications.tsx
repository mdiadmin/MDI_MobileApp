import { useState, useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Prayer, toApiDay, combineDateTime, formatTime, getPrayerTimes, prunePrayerCache } from './prayerTimes';

// Persisted on/off flag for the Settings toggle.
const ENABLED_KEY = '@prayer_notifications_enabled';

// Android notification channel id.
const CHANNEL_ID = 'prayer-times';

// Identifier prefix for every notification this module schedules, so we can
// cancel exactly our own notifications instead of nuking anything another
// feature might schedule (cancelAllScheduledNotificationsAsync affects the
// whole app, not just this module).
const NOTIF_ID_PREFIX = 'prayer-notif:';

// Skip a redundant refresh if we already refreshed today within this
// window — repeated foregrounds (e.g. quick app switches) would otherwise
// cancel + reschedule up to 35 notifications every time.
const LAST_REFRESH_KEY = '@prayer_notifications_last_refresh';
const REFRESH_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

// The five daily prayers we schedule reminders for (the API also returns
// Sunrise/Sunset/Zawal/Jumah, which we skip).
const NOTIFY_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// How many days of prayer times to keep scheduled ahead. iOS caps pending
// notifications at 64; 5 prayers × 7 days = 35, comfortably under the limit.
// This means reminders keep firing even if the app isn't opened for a week.
const DAYS_AHEAD = 7;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function arePrayerNotificationsEnabled() {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
}

// True once the user has been asked (via the in-app soft prompt in
// RootLayout) whether they want prayer notifications, regardless of which
// way they answered. Used to decide whether to show that prompt again.
export async function hasPrayerNotificationDecision() {
  return (await AsyncStorage.getItem(ENABLED_KEY)) !== null;
}

async function setEnabledFlag(value: boolean) {
  await AsyncStorage.setItem(ENABLED_KEY, value ? 'true' : 'false');
}

// Requests notification permission (and sets up the Android channel). Returns
// true only if permission is granted.
export async function ensureNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.HIGH,
      
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (status !== 'granted') {
    finalStatus = (await Notifications.requestPermissionsAsync()).status;
  }
  return finalStatus === 'granted';
}

// Cancels only the notifications this module scheduled (identified by
// NOTIF_ID_PREFIX), leaving anything else the app may have scheduled intact.
async function cancelOwnedPrayerNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const owned = scheduled.filter((n) => n.identifier.startsWith(NOTIF_ID_PREFIX));
  await Promise.all(owned.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function cancelPrayerNotifications() {
  await cancelOwnedPrayerNotifications();
  await AsyncStorage.removeItem(LAST_REFRESH_KEY);
}

// In-flight guard so an overlapping call (e.g. a foreground event firing
// while the midnight timer is already mid-refresh) reuses the same promise
// instead of running two interleaved cancel/schedule passes.
let refreshInFlight: Promise<void> | null = null;

async function readLastRefresh(): Promise<{ at: number; day: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_REFRESH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function refreshPrayerNotificationsNow(force: boolean) {
  if (!(await arePrayerNotificationsEnabled())) return;
  if (!(await ensureNotificationPermission())) return;

  const now = new Date();
  const today = toApiDay(now);

  if (!force) {
    const last = await readLastRefresh();
    if (last && last.day === today && Date.now() - last.at < REFRESH_MIN_INTERVAL_MS) {
      return; // already refreshed today's schedule recently — nothing to do
    }
  }

  await cancelOwnedPrayerNotifications();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const day = toApiDay(date);

    let prayers: Prayer[];
    try {
      prayers = await getPrayerTimes(date);
    } catch {
      continue; // skip a day we couldn't fetch rather than aborting the rest
    }

    for (const p of prayers) {
      if (!NOTIFY_PRAYERS.includes(p.prayerName)) continue;

      const time = p.prayerAdhan ?? p.prayerBegins;
      if (!time) continue;

      const when = combineDateTime(date, time);
      if (when.getTime() <= now.getTime() + 1000) continue; // skip past/near-now

      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIF_ID_PREFIX}${day}:${p.prayerName}`,
        content: {
          title: p.prayerName,
          body: `It's time for ${p.prayerName} — ${formatTime(time)}`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
      });
    }
  }

  await AsyncStorage.setItem(LAST_REFRESH_KEY, JSON.stringify({ at: Date.now(), day: today }));
  await prunePrayerCache();
}

// Cancels and re-schedules local notifications for the next DAYS_AHEAD days at
// each prayer's adhan time. No-op if the feature is disabled or permission is
// not granted. Safe to call repeatedly (on launch, on foreground, at
// midnight): concurrent calls share one in-flight run, and a same-day call
// within REFRESH_MIN_INTERVAL_MS of the last one is skipped entirely unless
// `force` is passed (used when the user just flipped the Settings toggle on).
export async function refreshPrayerNotifications(options?: { force?: boolean }): Promise<void> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = refreshPrayerNotificationsNow(!!options?.force).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

// Turns the feature on (requesting permission first) or off. Returns the
// resulting enabled state so callers can detect a denied permission.
export async function setPrayerNotificationsEnabled(value: boolean): Promise<boolean> {
  if (value) {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      await setEnabledFlag(false);
      return false;
    }
    await setEnabledFlag(true);
    await refreshPrayerNotifications({ force: true });
    return true;
  }

  await setEnabledFlag(false);
  await cancelPrayerNotifications();
  return false;
}

// Called on app launch and whenever the app returns to the foreground. The
// very first on/off decision is made exactly once, by the user, via the
// in-app soft prompt in RootLayout (which calls setPrayerNotificationsEnabled
// directly) — this function only refreshes an *already-made* decision, so it
// never itself triggers the OS permission dialog.
export async function initPrayerNotifications() {
  const decided = await hasPrayerNotificationDecision();
  if (!decided) return;

  await refreshPrayerNotifications();
}

// Hook for the Settings toggle.
export function usePrayerNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    arePrayerNotificationsEnabled().then(setEnabled);
  }, []);

  const toggle = useCallback(async (value: boolean) => {
    setBusy(true);
    try {
      const result = await setPrayerNotificationsEnabled(value);
      setEnabled(result);
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  return { enabled, busy, toggle };
}

function msUntilNextMidnight() {
  const now = new Date();
  // 00:00:05 tomorrow — a small buffer so the device clock/date has surely rolled over.
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  return next.getTime() - now.getTime();
}

// Drop <PrayerNotifications /> into the root layout. It keeps the rolling
// schedule fresh: on launch, whenever the app returns to the foreground, and at
// each midnight while the app stays open. Renders nothing.
export default function PrayerNotifications() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initPrayerNotifications();

    const scheduleMidnight = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        refreshPrayerNotifications();
        scheduleMidnight(); // re-arm for the next day
      }, msUntilNextMidnight());
    };
    scheduleMidnight();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        refreshPrayerNotifications();
        scheduleMidnight();
      }
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      sub.remove();
    };
  }, []);

  return null;
}
