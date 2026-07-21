import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { Prayer, getPrayerCountdown } from '@/services/prayerTimes';

type PrayerCountdownRingProps = {
  prayers: Prayer[] | null;
  now: Date;
};

const SIZE = 84;
const STROKE = 7;
const RADIUS = SIZE / 2 - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatRemaining(ms: number) {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// The 84px "1h 42m to Asr" badge that overlaps the bottom of the home hero
// arch. The gold arc fills clockwise from 12 o'clock as the gap between the
// previous and next prayer elapses.
function PrayerCountdownRing({ prayers, now }: PrayerCountdownRingProps) {
  const countdown = useMemo(
    () => (prayers ? getPrayerCountdown(prayers, now) : null),
    [prayers, now]
  );

  const dashOffset = CIRCUMFERENCE * (1 - (countdown?.fraction ?? 0));

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.accentBg}
          strokeWidth={STROKE}
          fill="none"
        />
        {countdown ? (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.accent}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        ) : null}
      </Svg>

      <View style={styles.inner}>
        {countdown ? (
          <>
            <Text style={styles.time}>{formatRemaining(countdown.remainingMs)}</Text>
            <Text style={styles.label}>to {countdown.name}</Text>
          </>
        ) : (
          <Text style={styles.label}>Prayers{'\n'}complete</Text>
        )}
      </View>
    </View>
  );
}

export default React.memo(PrayerCountdownRing);

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: SIZE - STROKE * 2,
    height: SIZE - STROKE * 2,
    borderRadius: 999,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    lineHeight: 15,
  },
  label: {
    fontSize: 8.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
