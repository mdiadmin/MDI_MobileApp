import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ayah } from '@/types/quran';
import { colors, shadows } from '@/constants/theme';

const CARD_BORDER = 'rgba(201,147,58,0.2)';

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
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  ayahBadge: {
    alignSelf: 'flex-start',
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ayahNumber: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  arabicText: {
    fontSize: 23,
    lineHeight: 44,
    textAlign: 'right',
    color: colors.foreground,
    writingDirection: 'rtl',
    fontFamily: 'Amiri_700Bold',
  },
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.primaryLight,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});
