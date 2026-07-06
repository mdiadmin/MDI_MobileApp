import React from 'react';
import Svg, {
  Rect,
  Path,
  Circle,
  Ellipse,
} from 'react-native-svg';
import { colors } from '@/constants/theme';

export default function MosqueIcon() {
  return (
    <Svg viewBox="0 0 120 82" width={96} height={64}>
      <Rect x="4" y="26" width="10" height="50" rx="3" fill="white" />
      <Path d="M4 26 L9 10 L14 26 Z" fill="white" />
      <Circle cx="9" cy="7" r="3.5" fill={colors.accent} />
      <Rect x="106" y="26" width="10" height="50" rx="3" fill="white" />
      <Path d="M106 26 L111 10 L116 26 Z" fill="white" />
      <Circle cx="111" cy="7" r="3.5" fill={colors.accent} />
      <Rect x="18" y="44" width="84" height="32" rx="4" fill="white" />
      <Path d="M18 44 Q31 28 44 44 Z" fill="white" />
      <Path d="M76 44 Q89 28 102 44 Z" fill="white" />
      <Path d="M36 44 Q60 18 84 44 Z" fill="white" />
      <Circle cx="60" cy="16" r="4.5" fill={colors.accent} />
      <Circle cx="62.8" cy="13.5" r="3.5" fill={colors.primary} />
      <Path
        d="M53 76 L53 61 Q60 54 67 61 L67 76 Z"
        fill={colors.primary}
        opacity="0.35"
      />
      <Ellipse cx="37" cy="58" rx="5" ry="7" fill={colors.primary} opacity="0.25" />
      <Ellipse cx="83" cy="58" rx="5" ry="7" fill={colors.primary} opacity="0.25" />
    </Svg>
  );
}
