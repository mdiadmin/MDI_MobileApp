import React, { useId } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  Pattern,
  Polygon,
  Circle,
  Rect,
  G,
} from 'react-native-svg';

type GeometricPatternProps = {
  opacity?: number;
};

export default function GeometricPattern({ opacity = 0.07 }: GeometricPatternProps) {
  const patternId = useId().replace(/:/g, '');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 160 160" style={{ opacity }}>
        <Defs>
          <Pattern
            id={patternId}
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <G fill="white">
              <Polygon points="20,2 23,17 38,20 23,23 20,38 17,23 2,20 17,17" />
              <Circle cx="0" cy="0" r="1.5" />
              <Circle cx="40" cy="0" r="1.5" />
              <Circle cx="0" cy="40" r="1.5" />
              <Circle cx="40" cy="40" r="1.5" />
            </G>
          </Pattern>
        </Defs>
        <Rect fill={`url(#${patternId})`} width="100%" height="100%" />
      </Svg>
    </View>
  );
}
