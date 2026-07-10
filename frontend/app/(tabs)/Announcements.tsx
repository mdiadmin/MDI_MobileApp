import React, { useState, useEffect, useCallback, useMemo, useId } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import GeometricPattern from '@/components/GeometricPattern';
import LoadingState from '@/components/LoadingState';
import { colors, shadows } from '@/constants/theme';

const WP_POSTS_URL = 'https://daruliman.org/wp-json/wp/v2/posts?_fields=id,date,link,title,excerpt,category_info,_links,_embedded&_embed=wp:featuredmedia&per_page=10';

const HIDE_HEADER_FOOTER_SCRIPT = `
  const style = document.createElement('style');
  style.innerHTML = \`
    header, 
    footer, 
    .site-header, 
    .site-footer,
    #masthead,
    #colophon,
    .footer-widgets,
    .entry-related-inner-content,
    .related-posts {
      display: none !important;
    }
    
    body > .site-container:first-of-type,
    body > .site-container:last-of-type {
       display: none !important;
    }

    body {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }
  \`;
  document.head.appendChild(style);
  true; 
`;

interface WPPost {
  id: number;
  date: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  author_info?: { display_name: string; author_link?: string };
  featured_image_src_large?: [string, number, number, boolean] | false;
  category_info?: { term_id: number; name: string }[];
  _embedded?: { 'wp:featuredmedia'?: Array<{ source_url: string }> };
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  General: { bg: colors.secondary, text: colors.primary },
  Blog: { bg: colors.accentBg, text: colors.accent },
  Programs: { bg: '#EEF0FF', text: '#4A5AC9' },
};

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#8211;': '–',
    '&#8217;': '\u2019',
    '&#8216;': '\u2018',
    '&#8220;': '\u201C',
    '&#8221;': '\u201D',
    '&#8230;': '…',
  };

  let decoded = text;
  Object.entries(entities).forEach(([entity, char]) => {
    decoded = decoded.split(entity).join(char);
  });
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
  return decoded;
}

function stripHtml(html: string): string {
  const withoutTags = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return decodeHtmlEntities(withoutTags);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getPrimaryCategory(post: WPPost): string {
  return post.category_info?.[0]?.name ?? 'General';
}

function getImageUrl(post: WPPost): string | undefined {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? undefined; undefined;
}

function CategoryPill({ category }: { category: string }) {
  const style = CATEGORY_COLORS[category] ?? { bg: colors.secondary, text: colors.primary };
  return (
    <View style={[styles.categoryPill, { backgroundColor: style.bg }]}>
      <MaterialCommunityIcons name="tag-outline" size={9} color={style.text} />
      <Text style={[styles.categoryPillText, { color: style.text }]}>{category}</Text>
    </View>
  );
}

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

// FeaturedCard Component
function FeaturedCard({ post, onPress }: { post: WPPost; onPress: () => void }) {
  const title = decodeHtmlEntities(post.title.rendered);
  const category = getPrimaryCategory(post);
  const imageUrl = getImageUrl(post);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.featuredCard, shadows.card]}>
      <View style={styles.featuredImageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.featuredImage} resizeMode="cover" />
        ) : null}
        <ImageGradientOverlay />
        <View style={styles.featuredCategory}>
          <CategoryPill category={category} />
        </View>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle}>{title}</Text>
          <View style={styles.featuredDateRow}>
            <MaterialCommunityIcons name="clock-outline" size={11} color="rgba(255,255,255,0.6)" />
            <Text style={styles.featuredDate}>{formatDate(post.date)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// AnnouncementRow Component
function AnnouncementRow({ post, onPress }: { post: WPPost; onPress: () => void }) {
  const title = decodeHtmlEntities(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered);
  const category = getPrimaryCategory(post);
  const imageUrl = getImageUrl(post);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.rowCard, shadows.action]}>
      <View style={styles.thumbnail}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailEmoji}>🕌</Text>
          </View>
        )}
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowMeta}>
          <CategoryPill category={category} />
          <Text style={styles.rowDate}>{formatDate(post.date)}</Text>
        </View>
        <Text style={styles.rowTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.rowExcerpt} numberOfLines={1}>{excerpt}</Text>
      </View>
      <View style={styles.rowChevron}>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

// AnnouncementsHeader Component
function AnnouncementsHeader() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <StatusBar animated translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <GeometricPattern opacity={0.08} />
        <View style={styles.headerContent}>
          <View style={styles.headerSubtitleRow}>
            <MaterialCommunityIcons name="bell-outline" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.headerSubtitle}>Latest from the Masjid</Text>
          </View>
          <Text style={styles.headerTitle}>Announcements</Text>
        </View>
      </View>
    </>
  );
}

// Main Component
export default function Announcements() {
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedPost, setSelectedPost] = useState<WPPost | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(WP_POSTS_URL);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data: WPPost[] = await response.json();
      
      const sortedData = data.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setPosts(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const categories = useMemo(() => {
    const names = new Set<string>();
    posts.forEach((post) => {
      post.category_info?.forEach((category) => names.add(category.name));
    });
    return ['All', ...Array.from(names).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'All') return posts;
    return posts.filter((post) => post.category_info?.some((category) => category.name === activeFilter));
  }, [posts, activeFilter]);

  const featuredPost = activeFilter === 'All' && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const listPosts = activeFilter === 'All' ? filteredPosts.slice(1) : filteredPosts;

  if (loading) return <LoadingState message="Loading announcements..." />;

  if (error) {
    return (
      <View style={styles.screen}>
        <AnnouncementsHeader />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.errorText}>Something went wrong: {error}</Text>
          <TouchableOpacity onPress={fetchPosts} style={styles.retryButton}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AnnouncementsHeader />

      <FlatList
        data={listPosts}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {categories.map((category) => {
                const active = category === activeFilter;
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setActiveFilter(category)}
                    activeOpacity={0.85}
                    style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
                  >
                    <Text style={[styles.filterPillText, active ? styles.filterPillTextActive : styles.filterPillTextInactive]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {featuredPost ? (
              <FeaturedCard post={featuredPost} onPress={() => setSelectedPost(featuredPost)} />
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <AnnouncementRow post={item} onPress={() => setSelectedPost(item)} />
        )}
        ListEmptyComponent={
          filteredPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No announcements in this category</Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={!!selectedPost}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPost(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedPost ? decodeHtmlEntities(selectedPost.title.rendered) : ''}
            </Text>
            
            <View style={{ width: 40 }} />
          </View>
          
          {selectedPost && (
            <WebView 
              source={{ uri: selectedPost.link }} 
              style={styles.webview} 
              startInLoadingState={true}
              injectedJavaScript={HIDE_HEADER_FOOTER_SCRIPT}
              javaScriptEnabled={true}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: { 
    position: 'relative', 
    overflow: 'hidden', 
    backgroundColor: colors.primary, 
    paddingBottom: 24, 
    paddingHorizontal: 20 
  },
  headerContent: { 
    zIndex: 10 
  },
  headerSubtitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 4 
  },
  headerSubtitle: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 11, letterSpacing: 1.2, 
    textTransform: 'uppercase', 
    fontFamily: 'PlusJakartaSans_600SemiBold' 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 26, 
    lineHeight: 32, 
    fontFamily: 'DMSerifDisplay_400Regular' 
  },
  filterRow: { 
    paddingVertical: 12, 
    gap: 8 
  },
  filterPill: { 
    borderRadius: 999, 
    paddingHorizontal: 16, 
    paddingVertical: 6 
  },
  filterPillActive: { 
    backgroundColor: colors.primary, 
    ...shadows.widget 
  },
  filterPillInactive: { 
    backgroundColor: colors.card, 
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2 
  },
  filterPillText: { 
    fontSize: 12, 
    fontFamily: 'PlusJakartaSans_600SemiBold' 
  },
  filterPillTextActive: { 
    color: '#fff' 
  },
  filterPillTextInactive: { 
    color: colors.primaryLight 
  },
  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 120 
  },
  featuredCard: { 
    borderRadius: 16, 
    overflow: 'hidden',
    marginBottom: 12 
  },
  featuredImageWrap: { 
    height: 200, 
    backgroundColor: colors.secondary, 
    position: 'relative' 
  },
  featuredImage: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    width: '100%', 
    height: '100%' 
  },
  featuredCategory: { 
    position: 'absolute', 
    top: 12, 
    left: 12, 
    zIndex: 2 
  },
  featuredContent: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 16, 
    zIndex: 2 
  },
  featuredTitle: { 
    color: '#fff', 
    fontSize: 16, 
    lineHeight: 22, 
    fontFamily: 'DMSerifDisplay_400Regular' 
  },
  featuredDateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 8 
  },
  featuredDate: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: 11, 
    fontFamily: 'PlusJakartaSans_400Regular' 
  },
  rowCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.card, 
    borderRadius: 16, 
    padding: 14, 
    gap: 12, 
    marginBottom: 12 
  },
  thumbnail: { 
    width: 72, 
    height: 72, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: colors.secondary 
  },
  thumbnailImage: { 
    width: '100%', 
    height: '100%' 
  },
  thumbnailPlaceholder: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: colors.secondary 
  },
  thumbnailEmoji: { 
    fontSize: 26 
  },
  rowContent: {
    flex: 1, 
    minWidth: 0 
  },
  rowMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 6, 
    flexWrap: 'wrap' 
  },
  rowDate: { 
    color: colors.muted,
    fontSize: 10, 
    fontFamily: 'PlusJakartaSans_400Regular' 
  },
  rowTitle: { 
    color: colors.foreground, 
    fontSize: 13, 
    lineHeight: 18, 
    fontFamily: 'PlusJakartaSans_600SemiBold' 
  },
  rowExcerpt: { 
    color: colors.muted, 
    fontSize: 11, 
    marginTop: 4, 
    fontFamily: 'PlusJakartaSans_400Regular' 
  },
  rowChevron: { 
    justifyContent: 'center' 
  },
  categoryPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    borderRadius: 999, 
    paddingHorizontal: 10, 
    paddingVertical: 3 
  },
  categoryPillText: { 
    fontSize: 10, 
    letterSpacing: 0.4, 
    fontFamily: 'PlusJakartaSans_600SemiBold' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 64 
  },
  emptyEmoji: { 
    fontSize: 40, 
    marginBottom: 12 
  },
  emptyText: { 
    color: colors.muted, 
    fontSize: 14, 
    fontFamily: 'PlusJakartaSans_600SemiBold' 
  },
  errorContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 24, 
    gap: 12 
  },
  errorText: { 
    color: colors.primaryLight, 
    fontSize: 14, 
    textAlign: 'center', 
    fontFamily: 'PlusJakartaSans_400Regular' 
  },
  retryButton: { 
    marginTop: 4
  },
  retryText: { 
    color: colors.primary, 
    fontSize: 14, 
    fontFamily: 'PlusJakartaSans_600SemiBold' 
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: colors.card 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  modalCloseBtn: { 
    padding: 4, 
    width: 40 
  },
  modalTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 15, 
    fontFamily: 'PlusJakartaSans_600SemiBold', 
    color: colors.foreground 
  },
  webview: { 
    flex: 1, 
    backgroundColor: colors.background 
  }
});