import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

type SectionDotsProps = {
  color?: string;
};

// The small row of three rotated gold diamonds used next to section titles
// ("Prayer Times ◆ ◆ ◆") throughout the design.
function SectionDots({ color = colors.accent }: SectionDotsProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.diamond, { backgroundColor: color }]} />
      <View style={[styles.diamond, { backgroundColor: color }]} />
      <View style={[styles.diamond, { backgroundColor: color }]} />
    </View>
  );
}

export default React.memo(SectionDots);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  diamond: {
    width: 5,
    height: 5,
    transform: [{ rotate: '45deg' }],
  },
});
