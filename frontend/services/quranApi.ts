import { Surah, SurahListResponse, SurahWithAyahs, SurahEditionsResponse } from '../types/quran';

const BASE_URL = 'https://api.alquran.cloud/v1';

export async function getSurahList(): Promise<Surah[]> {
  const res = await fetch(`${BASE_URL}/surah`);
  if (!res.ok) throw new Error(`Failed to fetch surah list: ${res.status}`);
  const json: SurahListResponse = await res.json();
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