import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import { colors, shadows } from '@/constants/theme';
import SectionDots from '@/components/SectionDots';

type QuickAction = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  bg: string;
  route?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'bullhorn-outline', label: 'Announcements', color: colors.primary, bg: colors.secondary, route: '/Announcements' },
  // { icon: 'calendar-outline', label: 'Events', color: colors.accent, bg: colors.accentBg },
  { icon: 'book-open-variant', label: 'Quran', color: colors.accent, bg: colors.accentBg, route: '/quran' },
  { icon: 'map-marker-outline', label: 'Compass', color: colors.primary, bg: colors.secondary, route: '/QiblaFinder' },
];

const HORIZONTAL_PADDING = 16;
const GAP = 12;

export default function QuickActions() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const itemWidth = (width - HORIZONTAL_PADDING * 2 - GAP * 2) / 3;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Quick Access</Text>
        <SectionDots />
      </View>

      <View style={styles.grid}>
        {QUICK_ACTIONS.map(({ icon, label, color, bg, route }) => (
          <TouchableOpacity
            key={label}
            style={[styles.actionWrap, { width: itemWidth }]}
            activeOpacity={0.85}
            onPress={route ? () => router.push(route as Href) : undefined}
          >
            <Svg width={16} height={9} viewBox="0 0 16 9" style={styles.roof}>
              <Path d="M0,9 L8,0 L16,9 Z" fill={colors.accent} />
            </Svg>
            <View style={[styles.actionButton, shadows.action]}>
              <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
              </View>
              <Text style={styles.label}>{label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    color: colors.primary,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  actionWrap: {
    paddingTop: 8,
  },
  roof: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -8,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.card,
    paddingVertical: 18,
    paddingHorizontal: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryLight,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
