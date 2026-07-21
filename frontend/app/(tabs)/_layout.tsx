import React, { useId } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { colors } from '@/constants/theme';
// @ts-ignore: Side-effect CSS import without type declarations
import '@/global.css';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TAB_ICONS: Record<string, IconName> = {
  index: 'home-variant',
  Announcements: 'bullhorn-outline',
  quran: 'book-open-variant',
  QiblaFinder: 'compass-outline',
  Settings: 'cog-outline',
};

// The bottom edge rises to a point at top-center, matching the design's
// pointed-arch tab segments (`clip-path: polygon(15% 100%,15% 40%,50%
// 0%,85% 40%,85% 100%)`).
const SEGMENT_PATH = 'M15,100 L15,40 L50,0 L85,40 L85,100 Z';

function SegmentBackground() {
  const gradientId = useId().replace(/:/g, '');
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.primaryDark} />
        </LinearGradient>
      </Defs>
      <Path d={SEGMENT_PATH} fill={`url(#${gradientId})`} />
    </Svg>
  );
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function CustomTabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  return (
    <View style={[styles.bar, { bottom: insets.bottom + 12 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const iconName = TAB_ICONS[route.name] ?? 'circle-outline';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={typeof options.title === 'string' ? options.title : route.name}
            activeOpacity={0.8}
            style={styles.segment}
          >
            {isFocused && <SegmentBackground />}
            <MaterialCommunityIcons
              name={iconName}
              size={20}
              color={isFocused ? '#fff' : colors.muted}
              style={styles.icon}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="Announcements" options={{ title: 'Announcements' }} />
      <Tabs.Screen name="quran" options={{ title: 'Quran' }} />
      <Tabs.Screen name="QiblaFinder" options={{ title: 'Qibla' }} />
      <Tabs.Screen name="Settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 10,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    zIndex: 1,
  },
});
