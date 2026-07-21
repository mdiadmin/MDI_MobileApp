// Tunable knobs for the offline announcements cache. Kept in one place so
// the bound can be adjusted without hunting through the cache/service code.

// Full offline-readable content (body + images) is kept for at most this
// many posts, evicted least-recently-viewed first once either bound is hit.
export const MAX_CACHED_POSTS = 30;

// ...or this many bytes of images + body text, whichever limit is hit first.
export const MAX_CACHE_BYTES = 50 * 1024 * 1024; // ~50MB

// How many of the most-recently-fetched posts get their full content/images
// proactively cached in the background (up to the bounds above) without the
// user needing to open them first.
export const PROACTIVE_CACHE_COUNT = 15;

// Lightweight metadata (title/excerpt/date/category — no body, no images)
// is much cheaper to keep than full content, but "cheap per item" still
// adds up over a masjid's entire posting history — over many years of
// scrolling, an unbounded metadata list would mean every background
// refresh re-serializes an ever-growing AsyncStorage blob, and every
// infinite-scroll page fetched would make that write slower than the last.
// Bounded well above MAX_CACHED_POSTS so recent-ish browsing history still
// survives offline/restart; older posts simply stop being remembered
// between sessions (they're still fetchable again from the server).
export const MAX_METADATA_POSTS = 500;

// Posts per page for the list endpoint / infinite scroll.
export const POSTS_PAGE_SIZE = 10;

// Below this plain-text length (with no meaningful image), a post is
// treated as "sparse" and rendered with a calmer, non-scrolling layout.
export const SPARSE_CONTENT_TEXT_THRESHOLD = 60;

export const STORAGE_KEYS = {
  meta: '@announcements_meta_v2',
  hasSynced: '@announcements_has_synced_v1',
  manifest: '@announcements_cache_manifest_v1',
  contentPrefix: '@announcements_content:',
} as const;

export const CACHE_IMAGES_DIR = 'announcements-cache/images/';
