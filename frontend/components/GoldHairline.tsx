import React, { useId } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type GoldHairlineProps = {
  style?: ViewStyle;
};

// A thin gold rule that fades out toward both edges, used under section
// titles and between stacked rows in place of a flat border color.
function GoldHairline({ style }: GoldHairlineProps) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <View style={[styles.container, style]}>
      <Svg width="100%" height="1.5">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#C9933A" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#C9933A" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#C9933A" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

export default React.memo(GoldHairline);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 1.5,
  },
});
