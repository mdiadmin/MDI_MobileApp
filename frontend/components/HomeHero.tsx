import React, { useId } from 'react';
import { View, Text, Image, StatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import GeometricPattern from '@/components/GeometricPattern';
import PrayerCountdownRing from '@/components/PrayerCountdownRing';
import { colors } from '@/constants/theme';
import { Prayer } from '@/services/prayerTimes';
import { formatDateShort, getHijriDate } from '@/utils/date';

type HomeHeroProps = {
  now: Date;
  prayers: Prayer[] | null;
};

const ARCH_HEIGHT = 232;
const ARCH_INSET = 5;

// A simple gable/pediment outline: flat sides rising to a point at
// top-center, matching the design's `clip-path: polygon(0 100%,0 36%,50%
// 0%,100% 36%,100% 100%)`.
const ARCH_PATH = 'M0,100 L0,36 L50,0 L100,36 L100,100 Z';

function ArchPath({ fill }: { fill: string }) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <Path d={ARCH_PATH} fill={fill} />
    </Svg>
  );
}

function ArchGradient() {
  const gradientId = useId().replace(/:/g, '');
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
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

// Home screen's greeting arch + "time to next prayer" ring — replaces the
// old flat Header + DateStrip pair.
export default function HomeHero({ now, prayers }: HomeHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      <StatusBar animated backgroundColor="transparent" barStyle="light-content" />

      <View style={[styles.archOuter, { marginTop: insets.top + 20 }]}>
        <ArchPath fill={colors.accent} />

        <View
          style={[
            styles.archInner,
            { top: ARCH_INSET, left: ARCH_INSET, right: ARCH_INSET, bottom: ARCH_INSET },
          ]}
        >
          <ArchGradient />
          <GeometricPattern opacity={0.08} height={ARCH_HEIGHT} />

          <View style={styles.content}>
            <View style={styles.logoCircle}>
              <Image
                style={styles.logo}
                source={require('@/assets/images/MDI_logo.png')}
              />
            </View>
            <Text style={styles.greeting}>Assalamu Alaikum</Text>
            <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
          </View>
        </View>
      </View>

      <View style={styles.ringWrap}>
        <PrayerCountdownRing prayers={prayers} now={now} />
      </View>

      <Text style={styles.dateLine}>
        {formatDateShort(now)} · {getHijriDate(now)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 6,
  },
  archOuter: {
    height: ARCH_HEIGHT,
    position: 'relative',
  },
  archInner: {
    position: 'absolute',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  logo: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  greeting: {
    color: '#fff',
    fontSize: 21,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  bismillah: {
    color: '#E8C77E',
    fontSize: 14,
    marginTop: 6,
    opacity: 0.9,
    fontFamily: 'Amiri_400Regular',
  },
  ringWrap: {
    alignItems: 'center',
    marginTop: -42,
  },
  dateLine: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});
