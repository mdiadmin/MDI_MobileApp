import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import HomeHero from '@/components/HomeHero';
import PrayerTimesWidget from '@/components/PrayerTimesWidget';
import QuickActions from '@/components/QuickActions';
import DonateBanner from '@/components/DonateBanner';
import { colors } from '@/constants/theme';
import { usePrayerTimes } from '@/services/prayerTimes';

export default function Index() {
  const [now, setNow] = useState(new Date());
  const { prayers, error } = usePrayerTimes();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <HomeHero now={now} prayers={prayers} />
        <PrayerTimesWidget prayers={prayers} error={error} now={now} />
        <QuickActions />
        <DonateBanner />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
});
