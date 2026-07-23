import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  DEFAULT_FACILITY_PRICING,
  FacilityPricing,
  FacilitySpace,
  PricedItem,
} from '@/constants/bookingsForms';

const ENDPOINT = (Constants.expoConfig?.extra?.bookingsEndpoint as string) ?? '';
const CACHE_KEY = '@bookings_facility_pricing';

// Loose shape check for data coming from the Sheet / cache.
function looksLikePricing(x: unknown): x is FacilityPricing {
  const p = x as FacilityPricing;
  return !!p && Array.isArray(p.spaces) && Array.isArray(p.optional) && Array.isArray(p.av);
}

// Coerces types and drops malformed rows so one bad spreadsheet cell can't
// break the form. Falls back to bundled spaces if none survive (a form with no
// bookable space would be unusable).
function normalize(p: FacilityPricing): FacilityPricing {
  const spaces = p.spaces
    .filter((s) => s && s.key && s.label)
    .map<FacilitySpace>((s) => ({
      key: String(s.key),
      label: String(s.label),
      capacity: s.capacity ? Number(s.capacity) : undefined,
      base: Number(s.base) || 0,
      mandatory: Number(s.mandatory) || 0,
      mandatoryNote: s.mandatoryNote ? String(s.mandatoryNote) : undefined,
      included: String(s.included ?? ''),
    }));

  const clean = (arr: PricedItem[]): PricedItem[] =>
    arr
      .filter((i) => i && i.key && i.label)
      .map<PricedItem>((i) => ({
        key: String(i.key),
        label: String(i.label),
        price: Number(i.price) || 0,
        note: i.note ? String(i.note) : undefined,
      }));

  return {
    spaces: spaces.length ? spaces : DEFAULT_FACILITY_PRICING.spaces,
    optional: clean(p.optional),
    av: clean(p.av),
  };
}

async function fetchPricing(): Promise<FacilityPricing | null> {
  if (!ENDPOINT.trim()) return null;
  try {
    const sep = ENDPOINT.includes('?') ? '&' : '?';
    const res = await fetch(`${ENDPOINT}${sep}config=pricing`);
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; pricing?: unknown };
    if (data?.ok && looksLikePricing(data.pricing)) return normalize(data.pricing);
    return null;
  } catch {
    return null;
  }
}

// Returns facility pricing, resilient by design:
//   1. renders instantly with bundled defaults (never blank / never blocks),
//   2. swaps in the last-cached prices if present,
//   3. swaps in fresh prices from the Sheet when the fetch resolves.
// Any failure just leaves the previous good values in place.
export function useFacilityPricing(): FacilityPricing {
  const [pricing, setPricing] = useState<FacilityPricing>(DEFAULT_FACILITY_PRICING);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw && alive) {
          const parsed = JSON.parse(raw);
          if (looksLikePricing(parsed)) setPricing(normalize(parsed));
        }
      } catch {
        // ignore cache errors — defaults already showing
      }

      const fresh = await fetchPricing();
      if (fresh && alive) {
        setPricing(fresh);
        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        } catch {
          // ignore cache write errors
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return pricing;
}
