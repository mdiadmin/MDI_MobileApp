import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, shadows } from '@/constants/theme';

type QuickAction = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  bg: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'bullhorn-outline', label: 'Announcements', color: colors.primary, bg: colors.secondary },
  { icon: 'calendar-outline', label: 'Events', color: colors.accent, bg: colors.accentBg },
  { icon: 'television', label: 'Livestream', color: colors.primary, bg: colors.secondary },
  { icon: 'book-open-variant', label: 'Quran', color: colors.accent, bg: colors.accentBg },
  { icon: 'map-marker-outline', label: 'Location', color: colors.primary, bg: colors.secondary },
  { icon: 'account-group-outline', label: 'Volunteer', color: colors.accent, bg: colors.accentBg },
];

const HORIZONTAL_PADDING = 16;
const GAP = 12;

export default function QuickActions() {
  const { width } = useWindowDimensions();
  const itemWidth = (width - HORIZONTAL_PADDING * 2 - GAP * 2) / 3;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Quick Access</Text>

      <View style={styles.grid}>
        {QUICK_ACTIONS.map(({ icon, label, color, bg }) => (
          <TouchableOpacity
            key={label}
            style={[styles.actionButton, shadows.action, { width: itemWidth }]}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrap, { backgroundColor: bg }]}>
              <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.label}>{label}</Text>
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
  title: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 12,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.card,
    paddingVertical: 18,
    paddingHorizontal: 8,
    gap: 8,
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
