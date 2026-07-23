import React, { useId } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import GeometricPattern from '@/components/GeometricPattern';
import { colors, shadows } from '@/constants/theme';

type FeaturedBannerProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  // Tapping the card body (navigate to detail); the round gold button dials.
  onPress: () => void;
  onCall: () => void;
};

function EmeraldGradient() {
  const id = useId().replace(/:/g, '');
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.primaryDark} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export default function FeaturedBanner({
  eyebrow,
  title,
  subtitle,
  icon,
  onPress,
  onCall,
}: FeaturedBannerProps) {
  return (
    <View style={[styles.shadow, shadows.card]}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
        <EmeraldGradient />
        <GeometricPattern opacity={0.07} />

        <View style={styles.badge}>
          <MaterialCommunityIcons name={icon} size={24} color={colors.accent} />
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.callBtn}
          onPress={onCall}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Call ${title}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="phone" size={20} color={colors.primaryDark} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Shadow lives on an outer view; the inner card clips its gradient + texture.
  shadow: {
    borderRadius: 20,
    backgroundColor: colors.primaryDark,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 147, 58, 0.55)',
  },
  body: { flex: 1 },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginBottom: 2,
  },
  title: {
    color: '#fff',
    fontSize: 19,
    lineHeight: 24,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadows.donate,
  },
});
