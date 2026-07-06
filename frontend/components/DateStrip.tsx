import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows } from '@/constants/theme';
import { formatDateLong, getHijriDate } from '@/utils/date';

type DateStripProps = {
  now: Date;
};

export default function DateStrip({ now }: DateStripProps) {
  return (
    <View style={[styles.container, shadows.card]}>
      <View>
        <Text style={styles.greeting}>Assalamu Alaikum</Text>
        <Text style={styles.date}>{formatDateLong(now)}</Text>
      </View>
      <View style={styles.hijriBlock}>
        <Text style={styles.hijriLabel}>HIJRI</Text>
        <Text style={styles.hijriDate}>{getHijriDate(now)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.card,
    zIndex: 20,
  },
  greeting: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  date: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  hijriBlock: {
    alignItems: 'flex-end',
  },
  hijriLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  hijriDate: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
