// Raw WordPress REST API post shape (wp-json/wp/v2/posts).
export interface WPPost {
  id: number;
  date: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  category_info?: { term_id: number; name: string }[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      media_details?: {
        sizes?: Record<string, { source_url: string; width: number; height: number }>;
      };
    }>;
  };
}

export interface WPPostsPage {
  posts: WPPost[];
  totalPages: number;
}

// Cheap, text-only metadata kept for every post ever fetched — enough to
// render list rows and support offline browsing of the whole feed even for
// posts whose full content/images were never cached.
export interface PostMeta {
  id: number;
  date: string;
  link: string;
  title: string;
  excerpt: string;
  category: string;
  thumbnailUrl?: string;
  featuredUrl?: string;
}

// Minimal HTML AST produced by services/htmlContent.ts and consumed by
// components/announcements/PostContent.tsx.
export type ContentNode =
  | { type: 'text'; text: string }
  | { type: 'element'; tag: string; attribs: Record<string, string>; children: ContentNode[] };

// Where a given <img src> should be read from when rendering a post body.
// Bundled starter-snapshot images are resolved to a local uri at load time
// (services/starterSnapshot.ts) via RN's Image.resolveAssetSource, so this
// only ever needs to distinguish remote/local/unavailable.
export type ImageResolution =
  | { kind: 'remote'; uri: string }
  | { kind: 'local'; uri: string }
  | { kind: 'unavailable' };

export type ImageResolver = (remoteSrc: string) => ImageResolution;

// Full body cached for offline reading (bounded set — see announcementsCache.ts).
export interface CachedPostContent {
  postId: number;
  cachedAt: number;
  lastViewedAt: number;
  nodes: ContentNode[];
  images: Record<string, string>; // remote URL -> local file:// URI
  contentBytes: number;
  imageBytes: number;
}

// Bundled first-launch snapshot (assets/data/starterPosts.ts). contentHtml
// is parsed at load time with the same parseWpContent() used everywhere
// else, rather than shipping a pre-parsed AST, so there's one parsing code
// path. images maps each original remote image URL referenced in
// contentHtml to a require()'d bundled asset id (resolved to a uri via
// services/starterSnapshot.ts).
export interface StarterPost {
  id: number;
  date: string;
  link: string;
  title: string;
  excerpt: string;
  category: string;
  contentHtml: string;
  featuredImageUrl?: string;
  images: Record<string, number>;
}
