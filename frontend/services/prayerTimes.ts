import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const URL = 'https://portal.ad-din.ca/v1/masjid/Prayer/GetPrayerTimesOfDay?masjidId=542';

// Public key published on the masjid's own display page (portal.ad-din.ca) —
// not a secret, but kept in config rather than inline so rotation is a
// config change rather than a code change.
const ADDIN_API_KEY = Constants.expoConfig?.extra?.adDinApiKey as string;

// Per-day cache of fetched prayer times, keyed by the API day string.
const CACHE_PREFIX = '@prayer_times_cache:';

// How long a cached day is treated as fresh before we bother re-fetching it.
// Repeated foregrounds/mounts within this window make zero API calls; a
// given date's times don't change often, so a half-day window is plenty.
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export type Prayer = {
  prayerName: string;
  prayerBegins: string | null; // "13:23:00"
  prayerAdhan: string | null;
  prayerIqamah: string | null;
};

type CacheEntry = { fetchedAt: number; prayers: Prayer[] };

// The API expects a non-zero-padded date, e.g. "2026-7-14".
export function toApiDay(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function combineDateTime(date: Date, hms: string) {
  const [h, m, s] = hms.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, s || 0);
}

export function formatTime(hms: string) {
  const [h, m] = hms.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

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

// Instant, network-free read of whatever's cached for a day (regardless of
// age). Used to paint a screen immediately while a fresh fetch happens in
// the background.
export async function getCachedPrayerTimes(date: Date): Promise<Prayer[] | null> {
  const cached = await readPrayerCache(toApiDay(date));
  return cached?.prayers ?? null;
}

// Raw network fetch — always hits the API and refreshes the cache on success.
async function fetchPrayerTimes(date = new Date()): Promise<Prayer[]> {
  const day = toApiDay(date);
  const time = date.toTimeString().split(' ')[0]; // "HH:MM:SS"

  const res = await fetch(`${URL}&day=${day}&time=${time}`, {
    headers: { 'ADDIN-API-KEY': ADDIN_API_KEY },
  });

  if (!res.ok) throw new Error(`Prayer times request failed: ${res.status}`);

  const json = await res.json();
  const prayers = json?.data?.prayerOfDay?.singlePrayers;
  if (!Array.isArray(prayers)) throw new Error('Unexpected prayer times response shape');

  await writePrayerCache(day, prayers as Prayer[]);
  return prayers as Prayer[];
}

// Cache-first accessor. Avoids re-hitting the API for a day we already
// fetched recently (so repeated foregrounds/mounts cost no network), and
// falls back to any cached copy — regardless of age — when offline.
export async function getPrayerTimes(date: Date): Promise<Prayer[]> {
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

// Order (and inclusion) of rows shown in the widget — a superset of the five
// prayers the notification scheduler cares about, matching what a masjid
// display board typically shows.
export const DISPLAY_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumah'];

export function sortForDisplay(prayers: Prayer[]): Prayer[] {
  return prayers
    .filter((p) => DISPLAY_ORDER.includes(p.prayerName))
    .sort((a, b) => DISPLAY_ORDER.indexOf(a.prayerName) - DISPLAY_ORDER.indexOf(b.prayerName));
}

export function getNextPrayerName(prayers: Prayer[], now: Date): string | null {
  for (const p of prayers) {
    const time = p.prayerAdhan ?? p.prayerBegins;
    if (!time) continue;
    if (combineDateTime(now, time).getTime() > now.getTime()) {
      return p.prayerName;
    }
  }
  return null;
}

export type PrayerCountdown = {
  name: string;
  remainingMs: number;
  // Elapsed fraction (0-1) of the gap between the previous prayer and the
  // next one — drives the countdown ring's fill.
  fraction: number;
};

// Resolves which prayer is next and how far through the current gap "now"
// is. Returns null once every prayer for the day has passed.
export function getPrayerCountdown(prayers: Prayer[], now: Date): PrayerCountdown | null {
  const times = sortForDisplay(prayers)
    .map((p) => {
      const t = p.prayerAdhan ?? p.prayerBegins;
      return t ? { name: p.prayerName, time: combineDateTime(now, t) } : null;
    })
    .filter((x): x is { name: string; time: Date } => x !== null);

  const nextIndex = times.findIndex((t) => t.time.getTime() > now.getTime());
  if (nextIndex === -1) return null;

  const next = times[nextIndex];
  const prev = nextIndex > 0 ? times[nextIndex - 1] : null;

  const remainingMs = next.time.getTime() - now.getTime();
  const totalMs = prev ? next.time.getTime() - prev.time.getTime() : remainingMs;
  const fraction = totalMs > 0 ? 1 - remainingMs / totalMs : 0;

  return { name: next.name, remainingMs, fraction: Math.min(1, Math.max(0, fraction)) };
}

// Shared cache-first loader: paints instantly from whatever's cached (no
// network), then refreshes. Both the home hero's countdown ring and the
// prayer times list need today's `prayers`, so they share this one fetch
// instead of each hitting the cache/API independently.
export function usePrayerTimes() {
  const [prayers, setPrayers] = useState<Prayer[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const today = new Date();

    const cached = await getCachedPrayerTimes(today);
    if (cached) setPrayers(cached);

    try {
      const fresh = await getPrayerTimes(today);
      setPrayers(fresh);
      setError(false);
    } catch {
      if (!cached) setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { prayers, error };
}

// Removes cached days whose date is more than 7 days in the past. Callers
// only ever look forward, so past days are dead weight once they age out.
export async function prunePrayerCache() {
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
