import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Header from '@/components/Header';
import DateStrip from '@/components/DateStrip';
import PrayerTimesWidget from '@/components/PrayerTimesWidget';
import QuickActions from '@/components/QuickActions';
import DonateBanner from '@/components/DonateBanner';
import { colors } from '@/constants/theme';

export default function Index() {
  const [now, setNow] = useState(new Date());

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
        <Header />
        <DateStrip now={now} />
        <PrayerTimesWidget />
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
