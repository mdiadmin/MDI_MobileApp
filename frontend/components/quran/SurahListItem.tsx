import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Surah } from '@/types/quran';
import { colors, shadows } from '@/constants/theme';

type SurahListItemProps = {
  surah: Surah;
  onPress: () => void;
};

function SurahListItem({ surah, onPress }: SurahListItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, shadows.action]}
      activeOpacity={0.85}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{surah.number}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.englishName}>{surah.englishName}</Text>
        <Text style={styles.meta}>
          {surah.englishNameTranslation} · {surah.numberOfAyahs} verses
        </Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.arabicName}>{surah.name}</Text>
    </TouchableOpacity>
  );
}

export default React.memo(SurahListItem);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 13,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  englishName: {
    color: colors.foreground,
    fontSize: 14,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  meta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.hairline,
  },
  arabicName: {
    color: colors.primary,
    fontSize: 19,
    paddingLeft: 12,
    fontFamily: 'Amiri_700Bold',
  },
});
