import { Parser } from 'htmlparser2';
import { SPARSE_CONTENT_TEXT_THRESHOLD } from '@/constants/announcementsConfig';
import { ContentNode } from '@/types/announcements';

// Tags dropped entirely, along with everything inside them — not real
// reading content, and/or unrenderable natively (styles, scripts, embedded
// video/objects, iframes). No WebView anywhere in the read flow means no
// iframe embeds either.
const DROP_TAGS = new Set(['style', 'script', 'noscript', 'object', 'video', 'iframe', 'source', 'track']);

// Class-name substrings that mark WordPress page-builder chrome (Kadence
// video lightbox popups, decorative spacers) rather than actual content —
// dropped along with their subtree even though the wrapping tag (a <div>)
// is otherwise harmless.
const DROP_CLASS_PATTERN = /video-popup|videopopup|glightbox|lightbox|mfp-hide|kadence-spacer|wp-block-spacer/i;

type RootFrame = { children: ContentNode[] };
type ElementFrame = Extract<ContentNode, { type: 'element' }>;

// Parses WordPress `content.rendered` HTML into a small AST for native
// rendering (components/announcements/PostContent.tsx), stripping
// non-content markup as it goes rather than shipping it through as raw
// text or broken layout.
export function parseWpContent(html: string): ContentNode[] {
  const root: RootFrame = { children: [] };
  const stack: Array<RootFrame | ElementFrame> = [root];
  let dropDepth = 0;

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const tag = name.toLowerCase();
        const cls = attribs.class || '';
        const shouldDrop = dropDepth > 0 || DROP_TAGS.has(tag) || DROP_CLASS_PATTERN.test(cls);

        if (shouldDrop) {
          dropDepth++;
          return;
        }

        const node: ElementFrame = { type: 'element', tag, attribs, children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
      },
      ontext(text) {
        if (dropDepth > 0) return;
        stack[stack.length - 1].children.push({ type: 'text', text });
      },
      onclosetag() {
        if (dropDepth > 0) {
          dropDepth--;
          return;
        }
        if (stack.length > 1) stack.pop();
      },
    },
    { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true }
  );

  parser.write(html);
  parser.end();

  return root.children;
}

// Hoisted to module scope so it's built once, not on every decode call.
const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&#8211;': '–',
  '&#8217;': '’',
  '&#8216;': '‘',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8230;': '…',
};
const HTML_ENTITY_REGEX = new RegExp(Object.keys(HTML_ENTITY_MAP).join('|'), 'g');

// Lightweight entity decode for title/excerpt strings — these are short,
// mostly-plain-text fields, so a full parse is overkill.
export function decodeHtmlEntities(text: string): string {
  let decoded = text.replace(HTML_ENTITY_REGEX, (match) => HTML_ENTITY_MAP[match]);
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
  return decoded;
}

export function stripHtml(html: string): string {
  const withoutTags = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return decodeHtmlEntities(withoutTags);
}

const BUTTON_CLASS_PATTERN = /\bbutton\b|\bbtn\b|kb-button|kt-button|wp-element-button/i;
const DOWNLOAD_EXT_PATTERN = /\.(pdf|docx?|xlsx?|pptx?|zip)(\?|#|$)/i;

// CTA-style buttons (WP core "Buttons" block, Kadence advanced buttons,
// file-download buttons) are all rendered as <a class="...button...">.
export function isButtonLink(attribs: Record<string, string>): boolean {
  return BUTTON_CLASS_PATTERN.test(attribs.class || '');
}

// A button/link that hands off a file rather than navigating somewhere —
// rendered as a distinct download chip instead of a generic CTA.
export function isDownloadLink(attribs: Record<string, string>): boolean {
  return 'download' in attribs || DOWNLOAD_EXT_PATTERN.test(attribs.href || '');
}

export function flattenText(node: ContentNode): string {
  if (node.type === 'text') return node.text;
  return node.children.map(flattenText).join('');
}

function collectImageSrcs(nodes: ContentNode[], out: string[]) {
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    if (node.tag === 'img' && node.attribs.src) out.push(node.attribs.src);
    collectImageSrcs(node.children, out);
  }
}

// Every <img src> referenced in a post body — used to know what to
// pre-download when proactively/on-demand caching a post for offline use.
export function collectContentImageUrls(nodes: ContentNode[]): string[] {
  const out: string[] = [];
  collectImageSrcs(nodes, out);
  return Array.from(new Set(out));
}

export interface ContentRichness {
  plainTextLength: number;
  hasImage: boolean;
  isSparse: boolean;
}

// Detects posts whose body is basically empty (a one-liner, or just a file
// download) so the reader can use a calmer, non-scrolling layout instead of
// a mostly-blank screen.
export function computeContentRichness(nodes: ContentNode[]): ContentRichness {
  let plainTextLength = 0;
  let hasImage = false;

  function walk(node: ContentNode) {
    if (node.type === 'text') {
      plainTextLength += node.text.trim().length;
      return;
    }
    if (node.tag === 'img') hasImage = true;
    node.children.forEach(walk);
  }
  nodes.forEach(walk);

  return {
    plainTextLength,
    hasImage,
    isSparse: plainTextLength < SPARSE_CONTENT_TEXT_THRESHOLD && !hasImage,
  };
}
