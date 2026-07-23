import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, shadows } from '@/constants/theme';

export default function SubmittedScreen() {
  const router = useRouter();
  const { reference, service } = useLocalSearchParams<{ reference?: string; service?: string }>();

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.check}>
          <MaterialCommunityIcons name="check" size={44} color="#fff" />
        </View>

        <Text style={styles.title}>Request Sent</Text>
        <Text style={styles.subtitle}>
          Your {service ?? 'request'} has been received by the masjid team.
        </Text>

        {reference ? (
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Reference number</Text>
            <Text style={styles.refValue}>{reference}</Text>
          </View>
        ) : null}

        <View style={styles.nextBox}>
          <Text style={styles.nextTitle}>What happens next</Text>
          <Text style={styles.nextText}>
            The team will review your request and follow up by email or phone.
            You don't need to email info@daruliman.org — please keep your
            reference number for any questions.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, shadows.action]}
        onPress={() => router.back()}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: colors.foreground,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  refBox: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 24,
  },
  refLabel: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.muted,
  },
  refValue: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.primary,
    marginTop: 4,
  },
  nextBox: {
    backgroundColor: colors.accentBg,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
  },
  nextTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.foreground,
    marginBottom: 6,
  },
  nextText: {
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.primaryLight,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
