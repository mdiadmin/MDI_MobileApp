import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ArchHeader from '@/components/ArchHeader';
import LoadingState from '@/components/LoadingState';
import { AnnouncementRow } from '@/components/announcements/AnnouncementRow';
import FeaturedCard from '@/components/announcements/FeaturedCard';
import PostReader, { ReaderContent } from '@/components/announcements/PostReader';
import { colors, shadows } from '@/constants/theme';
import {
  cacheViewedPost,
  getCachedContent,
  getCachedMeta,
  getOfflineImageMap,
  hasSyncedBefore,
  markSynced,
  mergeCachedMeta,
  proactivelyCacheRecent,
  reconcileFreshMeta,
  touchCachedPost,
} from '@/services/announcementsCache';
import { fetchPostById, fetchPostsPage, toPostMeta } from '@/services/announcementsApi';
import { parseWpContent } from '@/services/htmlContent';
import { getStarterPosts } from '@/services/starterSnapshot';
import { ImageResolver, PostMeta } from '@/types/announcements';

function buildLocalResolver(imageMap: Record<string, string> | null | undefined): ImageResolver {
  return (src) => {
    const uri = imageMap?.[src];
    return uri ? { kind: 'local', uri } : { kind: 'unavailable' };
  };
}

const remoteResolver: ImageResolver = (src) => ({ kind: 'remote', uri: src });

export default function Announcements() {
  const netInfo = useNetInfo();
  const isOnline = netInfo.isConnected !== false;

  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [usingStarter, setUsingStarter] = useState(false);
  const [offlineImageMap, setOfflineImageMap] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedMeta, setSelectedMeta] = useState<PostMeta | null>(null);
  const [readerContent, setReaderContent] = useState<ReaderContent | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);

  const hasDataRef = useRef(false);
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  const refreshOfflineImageMap = useCallback(() => {
    getOfflineImageMap().then(setOfflineImageMap).catch(() => {});
  }, []);

  const loadFirstPage = useCallback(async () => {
    try {
      const { posts: freshPosts, totalPages: tp } = await fetchPostsPage(1);
      const freshMeta = freshPosts.map(toPostMeta);

      const metaList = await reconcileFreshMeta(freshMeta, tp <= 1);
      hasDataRef.current = true;
      setPosts(metaList);
      setUsingStarter(false);
      setPage(1);
      setTotalPages(tp);
      setError(null);

      await markSynced();
      proactivelyCacheRecent(freshMeta).then(refreshOfflineImageMap).catch(() => {});
    } catch (err) {
      // Only surface the error if we have nothing at all to show instead.
      if (!hasDataRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshOfflineImageMap]);

  // Cache-first paint: render instantly from whatever's on disk (real cache,
  // or — only before the very first successful sync ever — the bundled
  // starter snapshot), then refresh from the network in the background.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [cachedMeta, synced] = await Promise.all([getCachedMeta(), hasSyncedBefore()]);
      if (cancelled) return;

      if (cachedMeta && cachedMeta.length > 0) {
        hasDataRef.current = true;
        setPosts(cachedMeta);
        setLoading(false);
        refreshOfflineImageMap();
      } else if (!synced) {
        const starter = getStarterPosts();
        hasDataRef.current = true;
        setPosts(starter.map((s) => s.meta));
        setUsingStarter(true);
        setLoading(false);
      }
    })();

    loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [loadFirstPage, refreshOfflineImageMap]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFirstPage();
  };

  const loadNextPage = useCallback(async () => {
    if (loadingMore || page >= totalPages || !isOnlineRef.current || usingStarter) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { posts: freshPosts, totalPages: tp } = await fetchPostsPage(nextPage);
      const metaList = await mergeCachedMeta(freshPosts.map(toPostMeta));
      setPosts(metaList);
      setPage(nextPage);
      setTotalPages(tp);
    } catch {
      // silently ignore — scrolling again retries
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages, usingStarter]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    posts.forEach((p) => names.add(p.category));
    return ['All', ...Array.from(names).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'All') return posts;
    return posts.filter((p) => p.category === activeFilter);
  }, [posts, activeFilter]);

  const featuredPost = activeFilter === 'All' && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const listPosts = activeFilter === 'All' ? filteredPosts.slice(1) : filteredPosts;

  const resolveImageUri = useCallback(
    (meta: PostMeta): string | undefined => {
      if (usingStarter) return meta.thumbnailUrl;
      if (isOnline) return meta.featuredUrl ?? meta.thumbnailUrl;
      return offlineImageMap[meta.id];
    },
    [usingStarter, isOnline, offlineImageMap]
  );

  const openPost = useCallback(
    async (meta: PostMeta) => {
      setSelectedMeta(meta);
      setReaderContent(null);
      setReaderLoading(false);

      if (usingStarter) {
        const starter = getStarterPosts().find((s) => s.meta.id === meta.id);
        if (starter) setReaderContent({ nodes: starter.nodes, imageResolver: starter.imageResolver });
        return;
      }

      // Cache first — a post's full body is never held in memory just from
      // scrolling past it, so this (or the live fetch below) is the only
      // place content actually gets loaded.
      const cached = await getCachedContent(meta.id);
      if (cached) {
        setReaderContent({ nodes: cached.nodes, imageResolver: buildLocalResolver(cached.images) });
        touchCachedPost(meta.id).then(refreshOfflineImageMap).catch(() => {});
        return;
      }

      if (!isOnline) return; // stays null -> "connect to read this one"

      setReaderLoading(true);
      try {
        const fullPost = await fetchPostById(meta.id);
        setReaderContent({ nodes: parseWpContent(fullPost.content.rendered), imageResolver: remoteResolver });
        cacheViewedPost(fullPost).then(refreshOfflineImageMap).catch(() => {});
      } catch {
        setReaderContent(null);
      } finally {
        setReaderLoading(false);
      }
    },
    [usingStarter, isOnline, refreshOfflineImageMap]
  );

  if (loading) return <LoadingState message="Loading announcements..." />;

  if (error) {
    return (
      <View style={styles.screen}>
        <ArchHeader title="Announcements" eyebrow="Latest from the Masjid" icon="bell-outline" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.errorText}>Something went wrong: {error}</Text>
          <TouchableOpacity onPress={loadFirstPage} style={styles.retryButton}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ArchHeader title="Announcements" eyebrow="Latest from the Masjid" icon="bell-outline" />

      <FlatList
        data={listPosts}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReachedThreshold={0.4}
        onEndReached={loadNextPage}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        ListHeaderComponent={
          <>
            {usingStarter ? (
              <View style={styles.starterBanner}>
                <MaterialCommunityIcons name="information-outline" size={14} color={colors.primaryLight} />
                <Text style={styles.starterBannerText}>Showing sample posts — connect to load the latest</Text>
              </View>
            ) : null}

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
              <FeaturedCard post={featuredPost} imageUri={resolveImageUri(featuredPost)} onPress={() => openPost(featuredPost)} />
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <AnnouncementRow post={item} imageUri={resolveImageUri(item)} onPress={() => openPost(item)} />
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
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
        visible={!!selectedMeta}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedMeta(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedMeta(null)} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedMeta?.title ?? ''}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedMeta ? (
            <PostReader
              meta={selectedMeta}
              headerImageUri={resolveImageUri(selectedMeta)}
              content={readerContent}
              loading={readerLoading}
              onRetry={() => openPost(selectedMeta)}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  starterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    marginTop: 4,
  },
  starterBannerText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    flexShrink: 1,
  },
  filterRow: {
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    ...shadows.widget,
  },
  filterPillInactive: {
    backgroundColor: colors.card,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  filterPillTextInactive: {
    color: colors.primaryLight,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  footerLoading: {
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: colors.primaryLight,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  retryButton: {
    marginTop: 4,
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalCloseBtn: {
    padding: 4,
    width: 40,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.foreground,
  },
});
