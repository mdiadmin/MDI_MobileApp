import React, { useId } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '@/constants/theme';

// A thin gold line that fades out to the right — closes off the section label.
function GoldFadeDivider() {
  const id = useId().replace(/:/g, '');
  return (
    <View style={styles.dividerWrap}>
      <Svg width="100%" height={1}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.5} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={1} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export default function SectionLabel({ children }: { children: string }) {
  return (
    <View style={styles.row}>
      {/* Gold diamond bullet (a rotated square). */}
      <View style={styles.diamond} />
      <Text style={styles.label}>{children}</Text>
      <GoldFadeDivider />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 14,
    marginLeft: 2,
  },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  label: {
    fontSize: 16,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: colors.primary,
  },
  dividerWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
