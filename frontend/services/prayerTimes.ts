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
