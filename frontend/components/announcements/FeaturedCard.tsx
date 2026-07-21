import React, { useId } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { formatPostDate } from '@/services/announcementsApi';
import { colors, shadows } from '@/constants/theme';
import { PostMeta } from '@/types/announcements';
import CategoryPlaceholder from './CategoryPlaceholder';
import { CategoryPill } from './CategoryPill';

function ImageGradientOverlay() {
  const gradientId = useId().replace(/:/g, '');
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="rgba(15,44,30,0.9)" />
          <Stop offset="0.6" stopColor="rgba(15,44,30,0.2)" />
          <Stop offset="1" stopColor="rgba(15,44,30,0)" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
    </Svg>
  );
}

// imageUri is pre-resolved by the caller: the remote featured image while
// online, a locally-cached copy while offline, or undefined if neither is
// available — in which case a category placeholder fills the space instead
// of leaving it blank.
export default function FeaturedCard({ post, imageUri, onPress }: { post: PostMeta; imageUri?: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, shadows.card]}>
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <CategoryPlaceholder category={post.category} iconSize={40} style={StyleSheet.absoluteFill} />
        )}
        <ImageGradientOverlay />
        <View style={styles.categoryBadge}>
          <CategoryPill category={post.category} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="clock-outline" size={11} color="rgba(255,255,255,0.6)" />
            <Text style={styles.date}>{formatPostDate(post.date)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageWrap: {
    height: 200,
    backgroundColor: colors.secondary,
    position: 'relative',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 2,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  date: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
});
