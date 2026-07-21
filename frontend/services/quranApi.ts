import AsyncStorage from '@react-native-async-storage/async-storage';
import { Surah, SurahListResponse, SurahWithAyahs, SurahEditionsResponse } from '../types/quran';

const BASE_URL = 'https://api.alquran.cloud/v1';

// The list of 114 surahs is effectively static, so it's cached for instant
// paint on cold start rather than re-fetched from scratch every time.
const SURAH_LIST_CACHE_KEY = '@surah_list_cache_v1';

// Instant, network-free read of the cached surah list. Used to paint the
// Quran tab immediately while a fresh fetch happens in the background.
export async function getCachedSurahList(): Promise<Surah[] | null> {
  try {
    const raw = await AsyncStorage.getItem(SURAH_LIST_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Surah[]) : null;
  } catch {
    return null;
  }
}

export async function getSurahList(): Promise<Surah[]> {
  const res = await fetch(`${BASE_URL}/surah`);
  if (!res.ok) throw new Error(`Failed to fetch surah list: ${res.status}`);
  const json: SurahListResponse = await res.json();
  try {
    await AsyncStorage.setItem(SURAH_LIST_CACHE_KEY, JSON.stringify(json.data));
  } catch {
    // caching is best-effort — ignore write failures
  }
  return json.data;
}

export async function getSurah(
  surahNumber: number | string,
  editions: string[] = ['quran-uthmani', 'en.sahih']
): Promise<SurahWithAyahs[]> {
  const editionsParam = editions.join(',');
  const res = await fetch(`${BASE_URL}/surah/${surahNumber}/editions/${editionsParam}`);
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}: ${res.status}`);
  const json: SurahEditionsResponse = await res.json();
  return json.data;
}