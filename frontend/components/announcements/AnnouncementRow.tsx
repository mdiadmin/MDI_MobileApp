import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { formatPostDate } from '@/services/announcementsApi';
import { colors, shadows } from '@/constants/theme';
import { getCategoryDefaultImage } from '@/constants/announcementsCategories';
import { PostMeta } from '@/types/announcements';
import CategoryPlaceholder from './CategoryPlaceholder';
import { CategoryPill } from './CategoryPill';

// imageUri is pre-resolved by the caller (remote while online, local cache
// while offline, or undefined) — see FeaturedCard for the same convention.
function AnnouncementRowImpl({ post, imageUri, onPress }: { post: PostMeta; imageUri?: string; onPress: () => void }) {
  const defaultImage = getCategoryDefaultImage(post.category);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, shadows.action]}>
      <View style={styles.thumbnail}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumbnailImage} contentFit="cover" transition={150} />
        ) : defaultImage ? (
          <Image source={{ uri: defaultImage }} style={styles.thumbnailImage} contentFit="cover" />
        ) : (
          <CategoryPlaceholder category={post.category} iconSize={22} style={StyleSheet.absoluteFill} />
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.meta}>
          <CategoryPill category={post.category} />
          <Text style={styles.date}>{formatPostDate(post.date)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.excerpt} numberOfLines={1}>{post.excerpt}</Text>
      </View>
      <View style={styles.chevron}>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

export const AnnouncementRow = React.memo(AnnouncementRowImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  date: {
    color: colors.muted,
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  title: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  excerpt: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  chevron: {
    justifyContent: 'center',
  },
});
