import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import ArchHeader from '@/components/ArchHeader';
import FeaturedBanner from '@/components/bookings/FeaturedBanner';
import SectionLabel from '@/components/bookings/SectionLabel';
import ArchServiceCard from '@/components/bookings/ArchServiceCard';
import LinkCard from '@/components/bookings/LinkCard';
import { colors } from '@/constants/theme';
import { SPORTS_SKEDDA_URL, COUNSELLING_URL, FUNERAL_PHONE } from '@/constants/bookingsForms';

export default function BookingsHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const go = (path: string) => router.push(path as Href);

  return (
    <View style={styles.screen}>
      <ArchHeader
        title="Bookings & Services"
        eyebrow="Requests & Facilities"
        icon="calendar-check-outline"
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <FeaturedBanner
          eyebrow="Always Available"
          title="Funeral Services"
          subtitle="24/7 coordinator — tap to call"
          icon="flower-tulip-outline"
          onPress={() => go('/bookings/funeral')}
          onCall={() => Linking.openURL(`tel:${FUNERAL_PHONE}`)}
        />

        <SectionLabel>Book &amp; Request</SectionLabel>
        <View style={styles.grid}>
          <ArchServiceCard
            icon="office-building-outline"
            title="Facility Booking"
            description="Reserve a hall or space for your event"
            onPress={() => go('/bookings/facility')}
          />
          <ArchServiceCard
            icon="hand-heart-outline"
            title="Zakat Application"
            description="Apply for zakat assistance — private"
            onPress={() => go('/bookings/zakat')}
          />
        </View>

        <SectionLabel>Facilities &amp; More</SectionLabel>
        <LinkCard
          rows={[
            {
              icon: 'basketball',
              title: 'Sports Booking',
              description: 'Book a court or field at the ICM Sports Complex',
              external: true,
              onPress: () => WebBrowser.openBrowserAsync(SPORTS_SKEDDA_URL),
            },
            {
              icon: 'account-heart-outline',
              title: 'Counselling',
              description: 'Family & personal counselling support',
              external: true,
              onPress: () => WebBrowser.openBrowserAsync(COUNSELLING_URL),
            },
          ]}
        />

        <Text style={styles.footer}>
          Requests are sent securely to the masjid team, who will follow up by
          email or phone. General questions still go to info@daruliman.org.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // paddingTop clears the header's pointed dip so nothing overlaps it.
  content: { paddingHorizontal: 16, paddingTop: 22 },
  grid: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  footer: {
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 12,
  },
});
