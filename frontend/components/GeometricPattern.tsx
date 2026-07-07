import React, { useId } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
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
  const { width, height } = useWindowDimensions();
  const cell = Math.max(24, Math.min(48, Math.floor(Math.min(width, height) / 11.5)));
  const scale = cell / 50;
  
  const spacingMultiplier = 1.5; 
  const spacing = cell * spacingMultiplier;

  const seed = (Math.floor(width) << 0) ^ (Math.floor(height) << 8) ^ 0x9e3779b1;
  function mulberry32(a: number) {
    return function() {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(seed);

  // uniform tiled grid covering the viewport
  const cols = Math.ceil(width / spacing) + 1;
  const rows = Math.ceil(height / spacing) + 1;

  const cells: React.ReactNode[] = [];
  for (let ry = 0; ry < rows; ry++) {
    for (let rx = 0; rx < cols; rx++) {
      const x = rx * spacing + spacing / 2;
      const y = ry * spacing + spacing / 2;

      cells.push(
        <G key={`cell-${rx}-${ry}`} transform={`translate(${x} ${y}) scale(${scale})`}>
          <Polygon points="20,2 23,17 38,20 23,23 20,38 17,23 2,20 17,17" fill="white" />
        </G>
      );
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
        <G>{cells}</G>
      </Svg>
    </View>
  );
}
