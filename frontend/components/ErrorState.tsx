import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '@/constants/theme';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onSecondaryAction?: () => void;
  secondaryLabel?: string;
};

export default function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try Again',
  onSecondaryAction,
  secondaryLabel,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.accent} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </Pressable>
      )}
      {onSecondaryAction && secondaryLabel && (
        <Pressable onPress={onSecondaryAction}>
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
    gap: 12,
  },
  message: {
    color: colors.primaryLight,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  secondaryText: {
    color: colors.primaryLight,
    fontSize: 13,
    textDecorationLine: 'underline',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});
