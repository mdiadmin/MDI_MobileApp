#!/usr/bin/env node
/*
 * Regenerates the bundled first-launch starter snapshot — assets/data/starterPosts.ts
 * plus assets/images/starter/* — from whatever the live WordPress endpoint currently
 * returns. This snapshot is only ever shown before the first successful network sync
 * (see services/announcementsCache.ts:hasSyncedBefore), but it goes stale the moment
 * new posts are published, so re-run this before every release:
 *
 *   node scripts/generate-starter-snapshot.js
 *
 * and commit the resulting changes under assets/data/ and assets/images/starter/.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const WP_POSTS_URL =
  'https://daruliman.org/mystaging02/wp-json/wp/v2/posts?_fields=id,date,link,title,excerpt,content,category_info,_links,_embedded&_embed=wp:featuredmedia&per_page=8';
const POST_COUNT = 8;
const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images', 'starter');
const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'data', 'starterPosts.ts');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function stripHtml(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extOf(url) {
  const clean = url.split('?')[0];
  const match = clean.match(/\.[a-zA-Z0-9]{2,5}$/);
  return match ? match[0].toLowerCase() : '.jpg';
}

function getFeaturedUrl(post) {
  const media = post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0];
  if (!media) return undefined;
  const sizes = media.media_details && media.media_details.sizes;
  const pick = sizes && (sizes.medium_large || sizes.large);
  return (pick && pick.source_url) || media.source_url;
}

function collectContentImageUrls(html) {
  const urls = new Set();
  const re = /<img[^>]+src="([^"]+)"/gi;
  let match;
  while ((match = re.exec(html))) urls.add(match[1]);
  return Array.from(urls);
}

function jsString(value) {
  return JSON.stringify(value);
}

async function main() {
  console.log(`Fetching latest posts from the live endpoint...`);
  const posts = await fetchJson(WP_POSTS_URL);
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const selected = posts.slice(0, POST_COUNT);

  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  for (const existing of fs.readdirSync(IMAGES_DIR)) {
    fs.unlinkSync(path.join(IMAGES_DIR, existing));
  }

  const entries = [];

  for (const post of selected) {
    const featuredUrl = getFeaturedUrl(post);
    const contentImageUrls = collectContentImageUrls(post.content.rendered);
    const allImageUrls = Array.from(new Set([...(featuredUrl ? [featuredUrl] : []), ...contentImageUrls]));

    const imageEntries = [];
    for (let i = 0; i < allImageUrls.length; i++) {
      const url = allImageUrls[i];
      const filename = `${post.id}_${i}${extOf(url)}`;
      try {
        await downloadFile(url, path.join(IMAGES_DIR, filename));
        imageEntries.push({ remoteUrl: url, localFile: filename });
        console.log(`  [post ${post.id}] downloaded ${filename}`);
      } catch (err) {
        console.warn(`  [post ${post.id}] failed to download ${url}: ${err.message}`);
      }
    }

    entries.push({
      id: post.id,
      date: post.date,
      link: post.link,
      title: decodeEntities(post.title.rendered),
      excerpt: stripHtml(post.excerpt.rendered),
      category: (post.category_info && post.category_info[0] && post.category_info[0].name) || 'General',
      contentHtml: post.content.rendered,
      featuredImageUrl: featuredUrl,
      imageEntries,
    });
  }

  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Regenerate with `node scripts/generate-starter-snapshot.js` before each release,');
  lines.push("// or first-launch-offline installs will show indefinitely stale posts.");
  lines.push("import { StarterPost } from '@/types/announcements';");
  lines.push('');
  lines.push('export const STARTER_POSTS: StarterPost[] = [');

  entries.forEach((e) => {
    lines.push('  {');
    lines.push(`    id: ${e.id},`);
    lines.push(`    date: ${jsString(e.date)},`);
    lines.push(`    link: ${jsString(e.link)},`);
    lines.push(`    title: ${jsString(e.title)},`);
    lines.push(`    excerpt: ${jsString(e.excerpt)},`);
    lines.push(`    category: ${jsString(e.category)},`);
    lines.push(`    contentHtml: ${jsString(e.contentHtml)},`);
    lines.push(`    featuredImageUrl: ${e.featuredImageUrl ? jsString(e.featuredImageUrl) : 'undefined'},`);
    lines.push('    images: {');
    e.imageEntries.forEach((img) => {
      lines.push(`      ${jsString(img.remoteUrl)}: require(${jsString(`../images/starter/${img.localFile}`)}),`);
    });
    lines.push('    },');
    lines.push('  },');
  });

  lines.push('];');
  lines.push('');

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
  console.log(`\nWrote ${entries.length} posts to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`Wrote images to ${path.relative(process.cwd(), IMAGES_DIR)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
