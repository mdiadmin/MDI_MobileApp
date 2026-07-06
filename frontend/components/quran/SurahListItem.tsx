import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Surah } from '@/types/quran';
import { colors, shadows } from '@/constants/theme';

type SurahListItemProps = {
  surah: Surah;
  onPress: () => void;
};

export default function SurahListItem({ surah, onPress }: SurahListItemProps) {
  const isMeccan = surah.revelationType === 'Meccan';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, shadows.action]}
      activeOpacity={0.85}
    >
      <View style={[styles.numberBadge, isMeccan ? styles.meccanBadge : styles.medinanBadge]}>
        <Text style={styles.numberText}>{surah.number}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.englishName}>{surah.englishName}</Text>
        <Text style={styles.meta}>
          {surah.englishNameTranslation} · {surah.numberOfAyahs} verses · {surah.revelationType}
        </Text>
      </View>

      <Text style={styles.arabicName}>{surah.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meccanBadge: {
    backgroundColor: colors.secondary,
  },
  medinanBadge: {
    backgroundColor: colors.accentBg,
  },
  numberText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  info: {
    flex: 1,
  },
  englishName: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  meta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  arabicName: {
    color: colors.primary,
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
