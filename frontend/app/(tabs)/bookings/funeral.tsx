import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ArchHeader from '@/components/ArchHeader';
import { colors, shadows } from '@/constants/theme';
import { FUNERAL_PHONE, FUNERAL_PHONE_DISPLAY } from '@/constants/bookingsForms';

const BRING = [
  'Two government-issued photo IDs of the deceased (driver’s license, passport, or citizenship card)',
  'Statement of Death — Form 15',
  'Family Questionnaire',
  'Burial Services & Cemetery Information',
  'Grave plot number and buyer’s name (if already purchased)',
];

const HANDLED = [
  'Ghusl (ritual washing) and shroud (kafan)',
  'Janazah prayer arrangements',
  'Coordination with ISM for body pickup',
  'Assistance completing the required forms',
];

export default function FuneralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ArchHeader title="Funeral Services" showBack onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          During a bereavement, please call the coordinator directly — don’t wait
          on a form. Support is available 24/7.
        </Text>

        <TouchableOpacity
          style={[styles.callBtn, shadows.action]}
          onPress={() => Linking.openURL(`tel:${FUNERAL_PHONE}`)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="phone" size={22} color="#fff" />
          <View>
            <Text style={styles.callLabel}>Call Funeral Coordinator</Text>
            <Text style={styles.callNumber}>{FUNERAL_PHONE_DISPLAY} · available 24/7</Text>
          </View>
        </TouchableOpacity>

        <Section title="What to have ready" icon="clipboard-text-outline" items={BRING} />
        <Section title="What the masjid handles" icon="hands-pray" items={HANDLED} />
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  items,
}: {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  items: string[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.card}>
        {items.map((it, i) => (
          <View key={i} style={styles.row}>
            <MaterialCommunityIcons name="circle-small" size={20} color={colors.accent} />
            <Text style={styles.rowText}>{it}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 18 },
  intro: {
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.primaryLight,
    marginBottom: 18,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  callLabel: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  callNumber: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'DMSerifDisplay_400Regular', color: colors.primary },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 8 },
  rowText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.foreground,
  },
});
