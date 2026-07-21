import Constants from 'expo-constants';
import { decodeHtmlEntities, stripHtml } from '@/services/htmlContent';
import { PostMeta, WPPost, WPPostsPage } from '@/types/announcements';

const WP_POSTS_URL = Constants.expoConfig?.extra?.wpPostsUrl as string;

export function formatPostDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getPrimaryCategory(post: Pick<WPPost, 'category_info'>): string {
  return post.category_info?.[0]?.name ?? 'General';
}

// Picks an appropriately-sized rendition instead of always downloading the
// original upload (often 2000px+, several MB) for a 72x72 thumbnail.
export function getImageUrl(post: WPPost, size: 'thumbnail' | 'featured' = 'featured'): string | undefined {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return undefined;
  const sizes = media.media_details?.sizes;
  if (size === 'thumbnail') {
    return sizes?.thumbnail?.source_url ?? sizes?.medium?.source_url ?? media.source_url;
  }
  return sizes?.medium_large?.source_url ?? sizes?.large?.source_url ?? media.source_url;
}

export function toPostMeta(post: WPPost): PostMeta {
  return {
    id: post.id,
    date: post.date,
    link: post.link,
    title: decodeHtmlEntities(post.title.rendered),
    excerpt: stripHtml(post.excerpt.rendered),
    category: getPrimaryCategory(post),
    thumbnailUrl: getImageUrl(post, 'thumbnail'),
    featuredUrl: getImageUrl(post, 'featured'),
  };
}

// Fetches one page of the (already-sorted-by-date-desc) WordPress feed.
// Online browsing is never artificially limited — the caller pages through
// as many posts as the user scrolls to, this just fetches one page at a time.
export async function fetchPostsPage(page: number): Promise<WPPostsPage> {
  const separator = WP_POSTS_URL.includes('?') ? '&' : '?';
  const response = await fetch(`${WP_POSTS_URL}${separator}page=${page}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const posts: WPPost[] = await response.json();
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPagesHeader = response.headers.get('x-wp-totalpages');
  const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : page;

  return { posts, totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : page };
}

// Fetches a single post by id — used when the user opens a post whose full
// content isn't already in memory (e.g. an older post from a page that
// hasn't been paged into this session yet) while online.
export async function fetchPostById(id: number): Promise<WPPost> {
  const url = new URL(WP_POSTS_URL);
  url.searchParams.delete('per_page');
  url.searchParams.delete('page');
  const base = `${url.origin}${url.pathname}`;
  const response = await fetch(`${base}/${id}?${url.searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as WPPost;
}
