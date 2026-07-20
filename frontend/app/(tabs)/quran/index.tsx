import { useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenHeader from '@/components/ScreenHeader';
import SurahListItem from '@/components/quran/SurahListItem';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { getCachedSurahList, getSurahList } from '@/services/quranApi';
import { Surah } from '@/types/quran';
import { colors, shadows } from '@/constants/theme';

export default function SurahListScreen() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const hasDataRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Paint instantly from cache (the surah list rarely changes), then
    // refresh from the network in the background.
    getCachedSurahList().then((cached) => {
      if (cancelled || !cached) return;
      hasDataRef.current = true;
      setSurahs(cached);
      setLoading(false);
    });

    getSurahList()
      .then((fresh) => {
        if (cancelled) return;
        hasDataRef.current = true;
        setSurahs(fresh);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        // Only surface the error if we have nothing cached to show instead.
        if (!hasDataRef.current) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingState message="Loading surahs..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Al-Qur'an Al-Kareem"
        subtitle="114 Surahs · Uthmani & Sahih"
      />

      <View style={[styles.summaryCard, shadows.card]}>
        <View>
          <Text style={styles.summaryLabel}>Browse</Text>
          <Text style={styles.summaryTitle}>All Surahs</Text>
        </View>
        <View style={styles.summaryCount}>
          <Text style={styles.countNumber}>{surahs.length}</Text>
          <Text style={styles.countLabel}>TOTAL</Text>
        </View>
      </View>

      <FlatList
        data={surahs}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SurahListItem
            surah={item}
            onPress={() => router.push(`/quran/${item.number}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryCard: {
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
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  summaryTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  summaryCount: {
    alignItems: 'flex-end',
  },
  countNumber: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  countLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 0.6,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
});
