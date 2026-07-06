import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenHeader from '@/components/ScreenHeader';
import AyahCard from '@/components/quran/AyahCard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { getSurah } from '@/services/quranApi';
import { Ayah } from '@/types/quran';
import { colors, shadows } from '@/constants/theme';

export default function SurahDetailScreen() {
  const { surahNumber } = useLocalSearchParams<{ surahNumber: string }>();
  const router = useRouter();
  const [arabicAyahs, setArabicAyahs] = useState<Ayah[]>([]);
  const [translationAyahs, setTranslationAyahs] = useState<Ayah[]>([]);
  const [surahMeta, setSurahMeta] = useState<{
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surahNumber) return;

    getSurah(surahNumber)
      .then(([arabicData, translationData]) => {
        setArabicAyahs(arabicData.ayahs);
        setTranslationAyahs(translationData.ayahs);
        setSurahMeta({
          englishName: arabicData.englishName,
          englishNameTranslation: arabicData.englishNameTranslation,
          revelationType: arabicData.revelationType,
          numberOfAyahs: arabicData.numberOfAyahs,
          name: arabicData.name,
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [surahNumber]);

  if (loading) {
    return <LoadingState message="Loading surah..." />;
  }

  if (error || !surahMeta) {
    return <ErrorState message={error ?? 'Surah not found'} />;
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={surahMeta.englishName}
        subtitle={`${surahMeta.name} · ${surahMeta.revelationType}`}
        showBack
        onBack={() => router.back()}
      />

      <View style={[styles.infoCard, shadows.card]}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Translation</Text>
          <Text style={styles.infoValue}>{surahMeta.englishNameTranslation}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Verses</Text>
          <Text style={styles.infoValue}>{surahMeta.numberOfAyahs}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {arabicAyahs.map((ayah, i) => (
          <AyahCard
            key={ayah.number}
            arabic={ayah}
            translation={translationAyahs[i]}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  infoValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
});
