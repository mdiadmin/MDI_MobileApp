import React, { useId } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, Pattern, Polygon, Rect, G } from 'react-native-svg';

type GeometricPatternProps = {
  opacity?: number;
  // Optional explicit height for the pattern (e.g. a header's own height).
  // Defaults to the full window height, which is only correct when the
  // pattern actually fills the screen.
  height?: number;
};

function GeometricPattern({ opacity = 0.07, height: heightProp }: GeometricPatternProps) {
  const patternId = useId().replace(/:/g, '');
  const { width, height: windowHeight } = useWindowDimensions();
  const height = heightProp ?? windowHeight;
  const cell = Math.max(24, Math.min(48, Math.floor(Math.min(width, height) / 11.5)));
  const scale = cell / 50;
  const spacing = cell * 1.5;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={{ opacity }}>
        <Defs>
          {/* A single tiled pattern definition replaces what used to be a
              hand-built grid of individually-positioned <Polygon> nodes
              (~150-200 of them). The renderer tiles this natively. */}
          <Pattern id={patternId} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
            <G transform={`translate(${spacing / 2} ${spacing / 2}) scale(${scale})`}>
              <Polygon points="20,2 23,17 38,20 23,23 20,38 17,23 2,20 17,17" fill="white" />
            </G>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}

export default React.memo(GeometricPattern);
