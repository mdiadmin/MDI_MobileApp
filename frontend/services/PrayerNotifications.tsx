import { useState, useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = 'https://portal.ad-din.ca/v1/masjid/Prayer/GetPrayerTimesOfDay?masjidId=542';

// This is a public api key (published in the masjid's display page).
const ADDIN_API_KEY =
  'WVeh6FdhekwxiEiaxhKGsvy7sOh9V4Y6rWDt2vyoFvvMAFQ2eqxYBePjW1EXEAOL8jr6j0cddjcCJRZRAtrobKmXDy7BCEqi';

// Persisted on/off flag for the Settings toggle.
const ENABLED_KEY = '@prayer_notifications_enabled';

// Per-day cache of fetched prayer times, keyed by the API day string.
const CACHE_PREFIX = '@prayer_times_cache:';

// How long a cached day is treated as fresh before we bother re-fetching it.
// Repeated foregrounds within this window make zero API calls; a given date's
// times don't change often, so a half-day window is plenty.
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// Android notification channel id.
const CHANNEL_ID = 'prayer-times';

// The five daily prayers we schedule reminders for (the API also returns
// Sunrise/Sunset/Zawal/Jumah, which we skip).
const NOTIFY_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// How many days of prayer times to keep scheduled ahead. iOS caps pending
// notifications at 64; 5 prayers × 7 days = 35, comfortably under the limit.
// This means reminders keep firing even if the app isn't opened for a week.
const DAYS_AHEAD = 7;

type Prayer = {
  prayerName: string;
  prayerBegins: string | null; // "13:23:00"
  prayerAdhan: string | null;
  prayerIqamah: string | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// The API expects a non-zero-padded date, e.g. "2026-7-14".
function toApiDay(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function combineDateTime(date: Date, hms: string) {
  const [h, m, s] = hms.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, s || 0);
}

function formatTime(hms: string) {
  const [h, m] = hms.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

type CacheEntry = { fetchedAt: number; prayers: Prayer[] };

async function writePrayerCache(day: string, prayers: Prayer[]) {
  try {
    const entry: CacheEntry = { fetchedAt: Date.now(), prayers };
    await AsyncStorage.setItem(CACHE_PREFIX + day, JSON.stringify(entry));
  } catch {
    // caching is best-effort — ignore write failures
  }
}

async function readPrayerCache(day: string): Promise<CacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + day);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.prayers)) return parsed as CacheEntry;
    return null;
  } catch {
    return null;
  }
}

// Raw network fetch — always hits the API and refreshes the cache on success.
async function fetchPrayerTimes(date = new Date()): Promise<Prayer[]> {
  const day = toApiDay(date);
  const time = date.toTimeString().split(' ')[0]; // "HH:MM:SS"

  const res = await fetch(`${url}&day=${day}&time=${time}`, {
    headers: { 'ADDIN-API-KEY': ADDIN_API_KEY },
  });

  if (!res.ok) throw new Error(`Prayer times request failed: ${res.status}`);

  const json = await res.json();
  const prayers = json?.data?.prayerOfDay?.singlePrayers;
  if (!Array.isArray(prayers)) throw new Error('Unexpected prayer times response shape');

  await writePrayerCache(day, prayers as Prayer[]);
  return prayers as Prayer[];
}

// Cache-first accessor used by the scheduler. Avoids re-hitting the API for a
// day we already fetched recently (so repeated foregrounds cost no network),
// and falls back to any cached copy — regardless of age — when offline.
async function getPrayerTimes(date: Date): Promise<Prayer[]> {
  const day = toApiDay(date);
  const cached = await readPrayerCache(day);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.prayers;
  }

  try {
    return await fetchPrayerTimes(date);
  } catch (err) {
    if (cached) return cached.prayers;
    throw err;
  }
}

// Removes cached days whose date is more than 7 days in the past. The scheduler
// only ever looks forward, so past days are dead weight once they age out.
async function prunePrayerCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length === 0) return;

    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();

    const stale = cacheKeys.filter((k) => {
      const [y, m, d] = k.slice(CACHE_PREFIX.length).split('-').map(Number);
      if (!y || !m || !d) return false; // leave anything unparseable alone
      return new Date(y, m - 1, d).getTime() < cutoff;
    });

    if (stale.length) await AsyncStorage.multiRemove(stale);
  } catch {
    // best-effort cleanup — ignore failures
  }
}

export async function arePrayerNotificationsEnabled() {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
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
      sound: 'default',
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (status !== 'granted') {
    finalStatus = (await Notifications.requestPermissionsAsync()).status;
  }
  return finalStatus === 'granted';
}

export async function cancelPrayerNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancels and re-schedules local notifications for the next DAYS_AHEAD days at
// each prayer's adhan time. No-op if the feature is disabled or permission is
// not granted. Safe to call repeatedly (on launch, on foreground, at midnight).
export async function refreshPrayerNotifications() {
  if (!(await arePrayerNotificationsEnabled())) return;
  if (!(await ensureNotificationPermission())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);

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

  await prunePrayerCache();
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
    await refreshPrayerNotifications();
    return true;
  }

  await setEnabledFlag(false);
  await cancelPrayerNotifications();
  return false;
}

// Called once on app launch. On the very first run it prompts for notification
// permission and, if granted, turns reminders on by default. On later runs it
// just refreshes the schedule and respects whatever the user set in Settings.
export async function initPrayerNotifications() {
  const stored = await AsyncStorage.getItem(ENABLED_KEY);

  if (stored === null) {
    const granted = await ensureNotificationPermission();
    await setEnabledFlag(granted);
    if (granted) await refreshPrayerNotifications();
    return;
  }

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
