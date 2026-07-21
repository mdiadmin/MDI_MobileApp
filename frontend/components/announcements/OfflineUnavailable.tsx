import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '@/constants/theme';

// Shown when a post is outside the offline cache window and the device has
// no connection — deliberately calm and on-brand rather than an error
// screen, since nothing actually went wrong.
export default function OfflineUnavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="cloud-off-outline" size={30} color={colors.primaryLight} />
      </View>
      <Text style={styles.title}>Connect to read this one</Text>
      <Text style={styles.body}>
        This post hasn&apos;t been saved for offline reading yet. Reconnect to the internet to load it.
      </Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton} activeOpacity={0.85}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  retryText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
