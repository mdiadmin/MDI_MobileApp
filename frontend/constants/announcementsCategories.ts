import { colors } from '@/constants/theme';

export interface CategoryStyle {
  bg: string;
  text: string;
  icon: keyof typeof import('@expo/vector-icons/MaterialCommunityIcons').default.glyphMap;
}

// Per-category color + icon, used for both the category pill and the
// placeholder shown wherever an image is missing or not cached offline.
// Unlisted categories fall back to the default entry below.
const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  General: { bg: colors.secondary, text: colors.primary, icon: 'mosque' },
  Blog: { bg: colors.accentBg, text: colors.accent, icon: 'post-outline' },
  Programs: { bg: '#EEF0FF', text: '#4A5AC9', icon: 'calendar-star' },
  Moonsighting: { bg: '#EAF6FB', text: '#2E7BA6', icon: 'moon-waning-crescent' },
};

const DEFAULT_STYLE: CategoryStyle = { bg: colors.secondary, text: colors.primary, icon: 'image-outline' };

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}
