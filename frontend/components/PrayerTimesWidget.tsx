import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '@/constants/theme';
import {
  Prayer,
  combineDateTime,
  formatTime,
  getCachedPrayerTimes,
  getPrayerTimes,
} from '@/services/prayerTimes';

// Order (and inclusion) of rows shown in the widget — a superset of the five
// prayers the notification scheduler cares about, matching what a masjid
// display board typically shows.
const DISPLAY_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumah'];

function sortForDisplay(prayers: Prayer[]): Prayer[] {
  return prayers
    .filter((p) => DISPLAY_ORDER.includes(p.prayerName))
    .sort((a, b) => DISPLAY_ORDER.indexOf(a.prayerName) - DISPLAY_ORDER.indexOf(b.prayerName));
}

function getNextPrayerName(prayers: Prayer[], now: Date): string | null {
  for (const p of prayers) {
    const time = p.prayerAdhan ?? p.prayerBegins;
    if (!time) continue;
    if (combineDateTime(now, time).getTime() > now.getTime()) {
      return p.prayerName;
    }
  }
  return null;
}

export default function PrayerTimesWidget() {
  const [prayers, setPrayers] = useState<Prayer[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const today = new Date();

    // Paint instantly from whatever's cached (no network), then refresh.
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

  const rows = useMemo(() => (prayers ? sortForDisplay(prayers) : []), [prayers]);
  const nextPrayer = useMemo(() => (prayers ? getNextPrayerName(rows, new Date()) : null), [prayers, rows]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Prayer Times</Text>
      </View>

      <View style={[styles.card, styles.cardShadow]}>
        {prayers == null && !error && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {error && (
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name="wifi-off" size={20} color={colors.muted} />
            <Text style={styles.statusText}>Couldn't load prayer times</Text>
          </View>
        )}

        {rows.length > 0 && (
          <View style={[styles.row, styles.labelRow]}>
            <Text style={[styles.labelText, styles.colName]}>Prayer</Text>
            <Text style={[styles.labelText, styles.colTime]}>Adhan</Text>
            <Text style={[styles.labelText, styles.colTime]}>Iqamah</Text>
          </View>
        )}

        {rows.map((prayer, index) => {
          const isNext = prayer.prayerName === nextPrayer;
          const isLast = index === rows.length - 1;
          // Mirrors the original CSS's `.tr:not(.trfirst):nth-of-type(even)`
          // rule: nth-of-type counts the header row too, so the first data
          // row (2nd <tr> overall) is the "even" one and gets the white
          // background; the tinted background is the default for odd rows.
          const isTinted = index % 2 === 1;
          return (
            <View
              key={prayer.prayerName}
              style={[
                styles.row,
                isTinted ? styles.rowTinted : styles.rowWhite,
                isLast && styles.rowLast,
                isNext && styles.rowHighlight,
              ]}
            >
              <Text style={[styles.rowName, styles.colName, isNext && styles.rowTextHighlight]}>
                {prayer.prayerName}
              </Text>
              <Text
                style={[
                  styles.rowTime,
                  styles.colTime,
                  isNext && styles.rowTextHighlight,
                  isNext && styles.rowTimeHighlightWeight,
                ]}
              >
                {prayer.prayerAdhan ? formatTime(prayer.prayerAdhan) : ''}
              </Text>
              <Text style={[styles.rowIqamah, styles.colTime, isNext && styles.rowIqamahHighlight]}>
                {prayer.prayerIqamah ? formatTime(prayer.prayerIqamah) : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    color: colors.primary,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(27, 94, 56, 0.08)',
  },
  // Replicates the injected CSS's `box-shadow: 0 16px 40px rgba(27,94,56,0.08)`
  // exactly, rather than reusing the app's generic `shadows.widget`.
  cardShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  statusText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  // Mirrors `.thfirst`/`.tdfirst { flex: 1 1 45% }`.
  colName: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '45%',
    textAlign: 'left',
  },
  // Mirrors `.th`/`.td`/`.tdlast { flex: 0 0 24% }`.
  colTime: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '24%',
    textAlign: 'right',
  },
  // Mirrors the base `.tr` rule shared by the header and data rows.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(27, 94, 56, 0.08)',
    backgroundColor: colors.card,
  },
  // `.tr.trfirst` overrides the base row's padding and background.
  labelRow: {
    paddingVertical: 12,
    backgroundColor: 'rgba(27, 94, 56, 0.04)',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  // `.tr:not(.trfirst)` default background (tint).
  rowTinted: {
    backgroundColor: 'rgba(232, 242, 236, 0.4)',
  },
  // `.tr:not(.trfirst):nth-of-type(even)` override (white).
  rowWhite: {
    backgroundColor: '#FFFFFF',
  },
  // `.tr:last-child { border-bottom: none }`.
  rowLast: {
    borderBottomWidth: 0,
  },
  // `.tr.highlight` background.
  rowHighlight: {
    backgroundColor: colors.primary,
  },
  // `.tdfirst p`.
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  // `.td` (inherits the row's 15px/600 base; no explicit override).
  rowTime: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryLight,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  // `.tr.highlight .td p` bumps the Adhan column to bold, matching the name
  // and Iqamah columns' weight once a row is highlighted.
  rowTimeHighlightWeight: {
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  // `.tdlast`.
  rowIqamah: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  // `.tr.highlight .tdlast p`.
  rowIqamahHighlight: {
    color: colors.accent,
  },
  // `.tr.highlight .tdfirst p` / `.tr.highlight .td p` shared color.
  rowTextHighlight: {
    color: '#FFFFFF',
  },
});
