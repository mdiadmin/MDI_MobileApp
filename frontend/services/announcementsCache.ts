import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import {
  CACHE_IMAGES_DIR,
  MAX_CACHE_BYTES,
  MAX_CACHED_POSTS,
  MAX_METADATA_POSTS,
  PROACTIVE_CACHE_COUNT,
  STORAGE_KEYS,
} from '@/constants/announcementsConfig';
import { fetchPostById, getImageUrl } from '@/services/announcementsApi';
import { collectContentImageUrls, parseWpContent } from '@/services/htmlContent';
import { CachedPostContent, PostMeta, WPPost } from '@/types/announcements';

interface CacheManifestEntry {
  postId: number;
  cachedAt: number;
  lastViewedAt: number;
  contentBytes: number;
  imageBytes: number;
  imageLocalUris: Record<string, string>;
  // Local copy of the post's featured image, if it downloaded successfully —
  // hoisted out of imageLocalUris so list rows can resolve an offline
  // thumbnail without loading each post's full (much larger) content blob.
  featuredImageLocalUri?: string;
}

interface CacheManifest {
  entries: CacheManifestEntry[];
}

// ---------- Lightweight metadata cache (all posts ever seen) ----------

export async function getCachedMeta(): Promise<PostMeta[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.meta);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PostMeta[]) : null;
  } catch {
    return null;
  }
}

// Sorts newest-first and caps at MAX_METADATA_POSTS. Without this, an
// infinite-scroll session spanning years of archives would keep growing
// this list forever — and since it's persisted as one JSON blob, every
// further page fetched would re-serialize a bigger blob than the last.
function trimMeta(list: PostMeta[]): PostMeta[] {
  return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, MAX_METADATA_POSTS);
}

// Unions newly-fetched metadata into whatever's already cached (by id) so
// posts from earlier pages/sessions stay browsable offline even though only
// a bounded subset ever gets full content cached. This never detects
// deletions — use reconcileFreshMeta for the page-1 fetch, which can.
export async function mergeCachedMeta(newMeta: PostMeta[]): Promise<PostMeta[]> {
  const existing = (await getCachedMeta()) ?? [];
  const byId = new Map(existing.map((m) => [m.id, m]));
  newMeta.forEach((m) => byId.set(m.id, m));
  const merged = trimMeta(Array.from(byId.values()));
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.meta, JSON.stringify(merged));
  } catch {
    // caching is best-effort — ignore write failures
  }
  return merged;
}

// Reconciles a freshly-fetched page 1 (always the newest posts, sorted
// newest-first) against the cached metadata, unioning in new/updated posts
// like mergeCachedMeta — but also detecting deletions. WordPress always
// returns posts newest-first, so any previously-cached post whose publish
// date falls at or after the oldest post in this fresh page, but which
// isn't in the fresh page, can only be explained by having been deleted (if
// it were still live, it would necessarily still rank ahead of that oldest
// post). Cached posts older than that window are left untouched — they may
// simply live on a page this fetch didn't cover. When coversWholeFeed is
// true (the whole site fits on one page), that date-window carve-out is
// skipped and *any* missing post is treated as deleted.
export async function reconcileFreshMeta(freshMeta: PostMeta[], coversWholeFeed: boolean): Promise<PostMeta[]> {
  const existing = (await getCachedMeta()) ?? [];
  const freshIds = new Set(freshMeta.map((m) => m.id));
  const oldestFreshDate = freshMeta.length ? Math.min(...freshMeta.map((m) => new Date(m.date).getTime())) : Infinity;

  const deletedIds: number[] = [];
  const survivors = existing.filter((m) => {
    if (freshIds.has(m.id)) return true;
    const withinFetchedWindow = coversWholeFeed || new Date(m.date).getTime() >= oldestFreshDate;
    if (!withinFetchedWindow) return true;
    deletedIds.push(m.id);
    return false;
  });

  const byId = new Map(survivors.map((m) => [m.id, m]));
  freshMeta.forEach((m) => byId.set(m.id, m));
  const merged = trimMeta(Array.from(byId.values()));

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.meta, JSON.stringify(merged));
  } catch {
    // caching is best-effort — ignore write failures
  }

  if (deletedIds.length) await purgeCachedPosts(deletedIds);

  return merged;
}

// ---------- "Has real data ever synced" flag (gates the starter snapshot) ----------

export async function hasSyncedBefore(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEYS.hasSynced)) === '1';
  } catch {
    return false;
  }
}

export async function markSynced(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.hasSynced, '1');
  } catch {
    // best-effort — worst case the starter snapshot is (harmlessly) offered again
  }
}

// ---------- Full content + image cache (bounded, LRU-evicted) ----------

function getImagesDir(): Directory {
  const dir = new Directory(Paths.document, CACHE_IMAGES_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function inferExtension(url: string): string {
  const clean = url.split('?')[0];
  const match = clean.match(/\.[a-zA-Z0-9]{2,5}$/);
  return match ? match[0].toLowerCase() : '.jpg';
}

async function downloadImage(url: string, postId: number, index: number): Promise<{ uri: string; bytes: number } | null> {
  try {
    const dest = new File(getImagesDir(), `${postId}_${index}${inferExtension(url)}`);
    if (dest.exists) return { uri: dest.uri, bytes: dest.size };
    const file = await File.downloadFileAsync(url, dest, { idempotent: true });
    return { uri: file.uri, bytes: file.size };
  } catch {
    // an image failing to download shouldn't block the rest of the post —
    // it just falls back to the category placeholder when offline
    return null;
  }
}

function deleteEntryFiles(entry: CacheManifestEntry) {
  Object.values(entry.imageLocalUris).forEach((uri) => {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // best-effort cleanup
    }
  });
}

async function readManifest(): Promise<CacheManifest> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.manifest);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.entries) ? (parsed as CacheManifest) : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

async function writeManifest(manifest: CacheManifest): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.manifest, JSON.stringify(manifest));
  } catch {
    // best-effort — worst case the next eviction pass over/under-corrects slightly
  }
}

export async function getCachedContent(postId: number): Promise<CachedPostContent | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.contentPrefix + postId);
    if (!raw) return null;
    return JSON.parse(raw) as CachedPostContent;
  } catch {
    return null;
  }
}

async function writeCachedContent(cached: CachedPostContent): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.contentPrefix + cached.postId, JSON.stringify(cached));
  } catch {
    // best-effort
  }
}

async function upsertManifestEntry(entry: CacheManifestEntry): Promise<void> {
  const manifest = await readManifest();
  const idx = manifest.entries.findIndex((e) => e.postId === entry.postId);
  if (idx >= 0) manifest.entries[idx] = entry;
  else manifest.entries.push(entry);
  await writeManifest(manifest);
}

async function downloadAndCacheContent(post: WPPost, lastViewedAt: number): Promise<CachedPostContent> {
  const nodes = parseWpContent(post.content.rendered);
  const imageUrls = collectContentImageUrls(nodes);
  const featuredUrl = getImageUrl(post, 'featured');
  if (featuredUrl && !imageUrls.includes(featuredUrl)) imageUrls.push(featuredUrl);

  const images: Record<string, string> = {};
  let imageBytes = 0;
  for (let i = 0; i < imageUrls.length; i++) {
    const result = await downloadImage(imageUrls[i], post.id, i);
    if (result) {
      images[imageUrls[i]] = result.uri;
      imageBytes += result.bytes;
    }
  }

  const contentBytes = post.content.rendered.length;
  const cached: CachedPostContent = {
    postId: post.id,
    cachedAt: Date.now(),
    lastViewedAt,
    nodes,
    images,
    contentBytes,
    imageBytes,
  };

  await writeCachedContent(cached);
  await upsertManifestEntry({
    postId: post.id,
    cachedAt: cached.cachedAt,
    lastViewedAt,
    contentBytes,
    imageBytes,
    imageLocalUris: images,
    featuredImageLocalUri: featuredUrl ? images[featuredUrl] : undefined,
  });

  return cached;
}

// Post id -> locally-downloaded featured image URI, for every post currently
// in the content cache. Read once by the list screen so offline thumbnails
// can resolve a local file without loading each post's full (much larger)
// cached content blob just to find one image.
export async function getOfflineImageMap(): Promise<Record<number, string>> {
  const manifest = await readManifest();
  const map: Record<number, string> = {};
  manifest.entries.forEach((e) => {
    if (e.featuredImageLocalUri) map[e.postId] = e.featuredImageLocalUri;
  });
  return map;
}

// Whether a post's full content (readable with zero network) is cached.
export async function isContentCached(postId: number): Promise<boolean> {
  const manifest = await readManifest();
  return manifest.entries.some((e) => e.postId === postId);
}

// Marks an already-cached post as freshly viewed (protecting it from
// eviction ahead of everything else) without needing the full WPPost in
// hand — used when a post was cached previously (e.g. proactively) but
// isn't in this session's in-memory post map.
export async function touchCachedPost(postId: number): Promise<CachedPostContent | null> {
  const existing = await getCachedContent(postId);
  if (!existing) return null;

  const now = Date.now();
  const touched: CachedPostContent = { ...existing, lastViewedAt: now };
  await writeCachedContent(touched);

  const manifest = await readManifest();
  const idx = manifest.entries.findIndex((e) => e.postId === postId);
  if (idx >= 0) {
    manifest.entries[idx] = { ...manifest.entries[idx], lastViewedAt: now };
    await writeManifest(manifest);
  }

  await enforceCacheBudget(postId);
  return touched;
}

// Caches (or re-warms) a post the user just opened. Never re-downloads
// content/images that are already cached — just marks it as freshly viewed,
// which protects it from eviction ahead of everything else.
export async function cacheViewedPost(post: WPPost): Promise<CachedPostContent> {
  const touched = await touchCachedPost(post.id);
  if (touched) return touched;

  const cached = await downloadAndCacheContent(post, Date.now());
  await enforceCacheBudget(post.id);
  return cached;
}

// After a successful list fetch, proactively caches the most recent posts
// (up to PROACTIVE_CACHE_COUNT / the overall budget) so offline reading
// "just works" for current news without requiring the user to have opened
// anything yet. Takes lightweight metadata, not full posts — the list fetch
// deliberately doesn't carry `content`, so each candidate's body is fetched
// here individually, on demand, rather than the list ever downloading full
// bodies for posts nobody has asked to read yet. Posts cached this way are
// seeded with their publish date as lastViewedAt, so they naturally age out
// ahead of anything the user has actually read.
export async function proactivelyCacheRecent(candidates: PostMeta[]): Promise<void> {
  const manifest = await readManifest();
  const cachedIds = new Set(manifest.entries.map((e) => e.postId));
  const toFetch = candidates.slice(0, PROACTIVE_CACHE_COUNT).filter((m) => !cachedIds.has(m.id));

  for (const meta of toFetch) {
    try {
      const post = await fetchPostById(meta.id);
      await downloadAndCacheContent(post, new Date(meta.date).getTime());
    } catch {
      // a single post failing to fetch shouldn't block caching the rest
    }
  }

  await enforceCacheBudget();
}

// LRU eviction by lastViewedAt, bounded by whichever of MAX_CACHED_POSTS /
// MAX_CACHE_BYTES is hit first. excludePostId (the post the user just
// opened) is never evicted, even if evicting everything else still leaves
// the budget over.
export async function enforceCacheBudget(excludePostId?: number): Promise<void> {
  const manifest = await readManifest();
  let totalBytes = manifest.entries.reduce((sum, e) => sum + e.contentBytes + e.imageBytes, 0);
  let remainingCount = manifest.entries.length;

  const ordered = [...manifest.entries].sort((a, b) => {
    if (a.postId === excludePostId) return 1;
    if (b.postId === excludePostId) return -1;
    return a.lastViewedAt - b.lastViewedAt;
  });

  const toRemoveIds = new Set<number>();
  for (const entry of ordered) {
    if (entry.postId === excludePostId) continue;
    if (remainingCount <= MAX_CACHED_POSTS && totalBytes <= MAX_CACHE_BYTES) break;
    toRemoveIds.add(entry.postId);
    totalBytes -= entry.contentBytes + entry.imageBytes;
    remainingCount--;
  }

  if (toRemoveIds.size === 0) return;
  await removeFromManifest(manifest, toRemoveIds);
}

// Deletes cached content/images for the given post ids (files + AsyncStorage
// blobs) and removes them from the manifest. Shared by LRU eviction and by
// reconcileFreshMeta's deleted-on-the-server cleanup.
async function removeFromManifest(manifest: CacheManifest, ids: Set<number>): Promise<void> {
  const removedEntries = manifest.entries.filter((e) => ids.has(e.postId));
  if (removedEntries.length === 0) return;

  manifest.entries = manifest.entries.filter((e) => !ids.has(e.postId));
  removedEntries.forEach(deleteEntryFiles);
  await AsyncStorage.multiRemove(removedEntries.map((e) => STORAGE_KEYS.contentPrefix + e.postId));
  await writeManifest(manifest);
}

// Removes posts (metadata + any cached content/images) that no longer exist
// on the server. Purges by id directly — used when the caller already knows
// a post is gone (see reconcileFreshMeta).
async function purgeCachedPosts(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const manifest = await readManifest();
  await removeFromManifest(manifest, idSet);
}
