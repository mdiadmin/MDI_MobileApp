import { Image } from 'react-native';
import { STARTER_POSTS } from '@/assets/data/starterPosts';
import { parseWpContent } from '@/services/htmlContent';
import { ContentNode, ImageResolver, PostMeta, StarterPost } from '@/types/announcements';

// The bundled first-launch snapshot (see scripts/generate-starter-snapshot.js
// for how it's generated/refreshed). Images ship as require()'d bundle
// assets, so — unlike everything else in the announcements feature — they're
// available unconditionally, online or offline: thumbnailUrl/featuredUrl on
// the returned PostMeta are already-resolved local uris, not remote URLs.
export interface ResolvedStarterPost {
  meta: PostMeta;
  headerImageUri?: string;
  nodes: ContentNode[];
  imageResolver: ImageResolver;
}

function resolveAssetUri(assetId: number): string | undefined {
  try {
    return Image.resolveAssetSource(assetId)?.uri;
  } catch {
    return undefined;
  }
}

function toResolved(post: StarterPost): ResolvedStarterPost {
  const uriByRemoteUrl: Record<string, string> = {};
  Object.entries(post.images).forEach(([remoteUrl, assetId]) => {
    const uri = resolveAssetUri(assetId);
    if (uri) uriByRemoteUrl[remoteUrl] = uri;
  });

  const imageResolver: ImageResolver = (src) => {
    const uri = uriByRemoteUrl[src];
    return uri ? { kind: 'local', uri } : { kind: 'unavailable' };
  };

  const headerImageUri = post.featuredImageUrl ? uriByRemoteUrl[post.featuredImageUrl] : undefined;

  return {
    meta: {
      id: post.id,
      date: post.date,
      link: post.link,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      thumbnailUrl: headerImageUri,
      featuredUrl: headerImageUri,
    },
    headerImageUri,
    nodes: parseWpContent(post.contentHtml),
    imageResolver,
  };
}

let resolvedCache: ResolvedStarterPost[] | null = null;

export function getStarterPosts(): ResolvedStarterPost[] {
  if (!resolvedCache) resolvedCache = STARTER_POSTS.map(toResolved);
  return resolvedCache;
}
