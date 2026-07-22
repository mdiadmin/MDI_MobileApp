import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { formatPostDate } from '@/services/announcementsApi';
import { computeContentRichness } from '@/services/htmlContent';
import { colors, shadows } from '@/constants/theme';
import { ContentNode, ImageResolver, PostMeta } from '@/types/announcements';
import { getCategoryDefaultImage } from '@/constants/announcementsCategories';
import { CategoryPill } from './CategoryPill';
import CategoryPlaceholder from './CategoryPlaceholder';
import OfflineUnavailable from './OfflineUnavailable';
import PostContent from './PostContent';

export interface ReaderContent {
  nodes: ContentNode[];
  imageResolver: ImageResolver;
}

interface PostReaderProps {
  meta: PostMeta;
  headerImageUri?: string;
  content: ReaderContent | null;
  loading: boolean;
  onRetry: () => void;
}

export default function PostReader({ meta, headerImageUri, content, loading, onRetry }: PostReaderProps) {
  const richness = useMemo(() => (content ? computeContentRichness(content.nodes) : null), [content]);

  // Full-bleed width with a height driven by the image's own aspect ratio
  // (learned on load) rather than a fixed crop box, so nothing gets cut off.
  // Falls back to a 16:9 box until the real ratio is known.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  useEffect(() => setAspectRatio(null), [headerImageUri]);

  const defaultImage = useMemo(() => getCategoryDefaultImage(meta.category), [meta.category]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.headerImageWrap}>
        {headerImageUri ? (
          <Image
            source={{ uri: headerImageUri }}
            style={[styles.headerImage, { aspectRatio: aspectRatio ?? 16 / 9 }]}
            contentFit="cover"
            transition={150}
            onLoad={(e) => {
              const { width, height } = e.source;
              if (width && height) setAspectRatio(width / height);
            }}
          />
        ) : defaultImage ? (
          <Image
            source={{ uri: defaultImage }}
            style={[styles.headerImage, styles.headerImageFallback]}
            contentFit="cover"
          />
        ) : (
          <CategoryPlaceholder category={meta.category} iconSize={36} style={[styles.headerImage, styles.headerImageFallback]} />
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <CategoryPill category={meta.category} />
          <Text style={styles.date}>{formatPostDate(meta.date)}</Text>
        </View>
        <Text style={styles.title}>{meta.title}</Text>

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !content ? (
          <OfflineUnavailable onRetry={onRetry} />
        ) : richness?.isSparse ? (
          <View style={[styles.sparseCard, shadows.action]}>
            <MaterialCommunityIcons name="text-box-outline" size={24} color={colors.primaryLight} />
            <PostContent nodes={content.nodes} imageResolver={content.imageResolver} category={meta.category} />
          </View>
        ) : (
          <PostContent nodes={content.nodes} imageResolver={content.imageResolver} category={meta.category} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 48,
  },
  headerImageWrap: {
    backgroundColor: colors.secondary,
  },
  headerImage: {
    width: '100%',
  },
  headerImageFallback: {
    height: 220,
  },
  body: {
    padding: 20,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  date: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  title: {
    color: colors.foreground,
    fontSize: 21,
    lineHeight: 28,
    fontFamily: 'DMSerifDisplay_400Regular',
    marginBottom: 4,
  },
  centerBlock: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sparseCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    alignItems: 'center',
  },
});
