import { Image } from 'react-native';
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

// Default photo shown wherever a post has no image of its own. Only
// categories listed here get a photo fallback — everything else keeps the
// icon placeholder (see CategoryPlaceholder). Resolved to a uri up front
// (rather than handing expo-image the raw require() id) to match how every
// other local asset in this feature is passed to expo-image — see
// services/starterSnapshot.ts.
const CATEGORY_DEFAULT_IMAGE_IDS: Record<string, number> = {
  General: require('@/assets/images/general.jpg'),
  Blog: require('@/assets/images/blog.jpg'),
  'Jummah Announcements': require('@/assets/images/jummah.jpg'),
};

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_DEFAULT_IMAGE_IDS)
    .map(([category, id]) => [category, Image.resolveAssetSource(id)?.uri])
    .filter(([, uri]) => !!uri)
);

export function getCategoryDefaultImage(category: string): string | null {
  return CATEGORY_DEFAULT_IMAGES[category] ?? null;
}
