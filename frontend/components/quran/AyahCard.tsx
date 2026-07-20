import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ayah } from '@/types/quran';
import { colors, shadows } from '@/constants/theme';

type AyahCardProps = {
  arabic: Ayah;
  translation?: Ayah;
};

function AyahCard({ arabic, translation }: AyahCardProps) {
  return (
    <View style={[styles.card, shadows.action]}>
      <View style={styles.ayahBadge}>
        <Text style={styles.ayahNumber}>{arabic.numberInSurah}</Text>
      </View>

      <Text style={styles.arabicText}>
        {arabic.text} ﴿{arabic.numberInSurah}﴾
      </Text>

      {translation ? (
        <Text style={styles.translationText}>{translation.text}</Text>
      ) : null}
    </View>
  );
}

export default React.memo(AyahCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  ayahBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  ayahNumber: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  arabicText: {
    fontSize: 22,
    lineHeight: 42,
    textAlign: 'right',
    color: colors.foreground,
    writingDirection: 'rtl',
  },
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.primaryLight,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});
