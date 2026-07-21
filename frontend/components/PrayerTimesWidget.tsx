import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '@/constants/theme';
import SectionDots from '@/components/SectionDots';
import {
  Prayer,
  formatTime,
  sortForDisplay,
  getNextPrayerName,
} from '@/services/prayerTimes';

type PrayerTimesWidgetProps = {
  prayers: Prayer[] | null;
  error: boolean;
  now: Date;
};

const DOT_COL_WIDTH = 28;

function TimelineTrack() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="timelineTrack" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.accent} stopOpacity={0.55} />
          <Stop offset="1" stopColor={colors.primary} stopOpacity={0.12} />
        </LinearGradient>
      </Defs>
      <Rect x={DOT_COL_WIDTH / 2 - 1} y="6" width="2" height="94%" fill="url(#timelineTrack)" />
    </Svg>
  );
}

export default function PrayerTimesWidget({ prayers, error, now }: PrayerTimesWidgetProps) {
  const rows = useMemo(() => (prayers ? sortForDisplay(prayers) : []), [prayers]);
  const nextPrayer = useMemo(() => (rows.length ? getNextPrayerName(rows, now) : null), [rows, now]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Prayer Times</Text>
        <SectionDots />
      </View>

      <View style={styles.timeline}>
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

        {rows.length > 0 && <TimelineTrack />}

        {rows.length > 0 && (
          <View style={styles.labelRow}>
            <View style={{ width: DOT_COL_WIDTH }} />
            <View style={styles.labelTimes}>
              <Text style={styles.labelText}>Adhan</Text>
              <Text style={styles.labelText}>Iqamah</Text>
            </View>
          </View>
        )}

        {rows.map((prayer) => {
          const isNext = prayer.prayerName === nextPrayer;
          return (
            <View key={prayer.prayerName} style={styles.row}>
              <View style={styles.dotCol}>
                <View style={[styles.dot, isNext && styles.dotNext]} />
              </View>
              <View style={[styles.card, styles.cardShadow, isNext && styles.cardNext]}>
                <Text style={[styles.name, isNext && styles.nameNext]}>{prayer.prayerName}</Text>
                <View style={styles.times}>
                  <Text style={[styles.adhan, isNext && styles.adhanNext]}>
                    {prayer.prayerAdhan ? formatTime(prayer.prayerAdhan) : ''}
                  </Text>
                  <Text style={[styles.iqamah, isNext && styles.iqamahNext]}>
                    {prayer.prayerIqamah ? formatTime(prayer.prayerIqamah) : ''}
                  </Text>
                </View>
              </View>
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
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    color: colors.primary,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  timeline: {
    position: 'relative',
    paddingLeft: 2,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  labelTimes: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 14,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    width: 56,
    textAlign: 'right',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  dotCol: {
    width: DOT_COL_WIDTH,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  dotNext: {
    width: 18,
    height: 18,
    backgroundColor: colors.accent,
    borderColor: '#fff',
    borderWidth: 3,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  cardShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardNext: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  name: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.foreground,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  nameNext: {
    color: '#fff',
  },
  times: {
    flexDirection: 'row',
    gap: 16,
  },
  adhan: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
    width: 56,
    textAlign: 'right',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  adhanNext: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  iqamah: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    width: 56,
    textAlign: 'right',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  iqamahNext: {
    color: colors.accent,
  },
});
