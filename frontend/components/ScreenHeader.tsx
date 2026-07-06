import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GeometricPattern from '@/components/GeometricPattern';
import { colors } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
};

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar
        animated
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <GeometricPattern opacity={0.09} />

        {showBack && onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { top: insets.top + 12 }]}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.primary,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    zIndex: 10,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});
