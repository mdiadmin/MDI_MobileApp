import React, { useId } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import GeometricPattern from '@/components/GeometricPattern';
import { colors } from '@/constants/theme';

type ArchHeaderProps = {
  title: string;
  subtitle?: string;
  // Eyebrow mode (icon + uppercase label above a left-aligned title) is used
  // by screens like Announcements/Settings. Omit it for the centered
  // title/subtitle layout used by the Quran list and surah detail screens.
  eyebrow?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  showBack?: boolean;
  onBack?: () => void;
};

// The bottom edge dips into a shallow downward point at center (a pennant
// tail), matching the design's `clip-path: polygon(0 0,100% 0,100% 88%,50%
// 100%,0 88%)`. `preserveAspectRatio="none"` stretches this to whatever box
// the header actually lays out to, so no measured width/height is needed.
const ARCH_PATH = 'M0,0 L100,0 L100,88 L50,100 L0,88 Z';

function ArchBackground() {
  const gradientId = useId().replace(/:/g, '');
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.primaryDark} />
        </LinearGradient>
      </Defs>
      <Path d={ARCH_PATH} fill={`url(#${gradientId})`} />
    </Svg>
  );
}

export default function ArchHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  showBack = false,
  onBack,
}: ArchHeaderProps) {
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
        <ArchBackground />
        <GeometricPattern opacity={0.08} />

        {showBack && onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { top: insets.top + 12 }]}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {eyebrow ? (
          <View style={styles.eyebrowContent}>
            <View style={styles.eyebrowRow}>
              {icon ? (
                <MaterialCommunityIcons name={icon} size={18} color="rgba(255,255,255,0.7)" />
              ) : null}
              <Text style={styles.eyebrow}>{eyebrow}</Text>
            </View>
            <Text style={styles.eyebrowTitle}>{title}</Text>
          </View>
        ) : showBack && onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.85}
            style={styles.content}
            accessibilityRole="button"
            accessibilityLabel="Back to list"
          >
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </TouchableOpacity>
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 40,
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
  eyebrowContent: {
    zIndex: 10,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  eyebrowTitle: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
});
