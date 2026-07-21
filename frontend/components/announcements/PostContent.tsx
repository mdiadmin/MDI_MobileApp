import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { flattenText, isButtonLink, isDownloadLink } from '@/services/htmlContent';
import { colors, shadows } from '@/constants/theme';
import { ContentNode, ImageResolver } from '@/types/announcements';
import CategoryPlaceholder from './CategoryPlaceholder';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function openExternal(href?: string) {
  if (!href) return;
  Linking.openURL(href).catch(() => {});
}

// ---------- inline (within-paragraph) rendering ----------

function renderInline(nodes: ContentNode[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];

  nodes.forEach((node, i) => {
    const key = `${keyPrefix}-${i}`;
    if (node.type === 'text') {
      const text = node.text.replace(/[\t\n\r]+/g, ' ');
      if (text) out.push(text);
      return;
    }

    switch (node.tag) {
      case 'br':
        out.push('\n');
        return;
      case 'strong':
      case 'b':
        out.push(
          <Text key={key} style={styles.bold}>
            {renderInline(node.children, key)}
          </Text>
        );
        return;
      case 'em':
      case 'i':
        out.push(
          <Text key={key} style={styles.italic}>
            {renderInline(node.children, key)}
          </Text>
        );
        return;
      case 'a':
        if (isButtonLink(node.attribs)) {
          // Button-styled links inside inline text are rare, but if it
          // happens, still render the label as plain (already-styled)
          // rather than nesting an interactive block inside a <Text>.
          out.push(flattenText(node));
          return;
        }
        out.push(
          <Text key={key} style={styles.link} onPress={() => openExternal(node.attribs.href)} suppressHighlighting>
            {renderInline(node.children, key)}
          </Text>
        );
        return;
      default:
        out.push(...renderInline(node.children, key));
    }
  });

  return out;
}

function isBlank(nodes: ContentNode[]): boolean {
  return flattenText({ type: 'element', tag: '', attribs: {}, children: nodes }).trim().length === 0;
}

// ---------- block-level rendering ----------

function PostImage({ src, attribs, resolver, category }: { src: string; attribs: Record<string, string>; resolver: ImageResolver; category: string }) {
  const w = parseInt(attribs.width || '', 10);
  const h = parseInt(attribs.height || '', 10);
  const aspectRatio = w > 0 && h > 0 ? w / h : 16 / 9;
  const resolved = resolver(src);

  if (resolved.kind === 'unavailable') {
    return <CategoryPlaceholder category={category} iconSize={32} style={[styles.image, { aspectRatio }]} />;
  }

  // contain (not cover) — this is the full article body, so the whole
  // image should always be visible rather than cropped to fill the box.
  return <Image source={{ uri: resolved.uri }} style={[styles.image, { aspectRatio }]} contentFit="contain" transition={150} />;
}

function PostButton({ label, href, isDownload }: { label: string; href?: string; isDownload: boolean }) {
  return (
    <TouchableOpacity
      onPress={() => openExternal(href)}
      activeOpacity={0.85}
      style={[styles.button, isDownload ? styles.downloadButton : styles.ctaButton]}
    >
      <MaterialCommunityIcons
        name={isDownload ? 'download-outline' : 'open-in-new'}
        size={16}
        color={isDownload ? colors.primary : '#fff'}
      />
      <Text style={[styles.buttonText, isDownload ? styles.downloadButtonText : styles.ctaButtonText]}>
        {label || (isDownload ? 'Download' : 'Open')}
      </Text>
    </TouchableOpacity>
  );
}

function findFirst(nodes: ContentNode[], tag: string): Extract<ContentNode, { type: 'element' }> | null {
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    if (node.tag === tag) return node;
    const found = findFirst(node.children, tag);
    if (found) return found;
  }
  return null;
}

function renderBlocks(nodes: ContentNode[], resolver: ImageResolver, category: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];

  nodes.forEach((node, i) => {
    const key = `${keyPrefix}-${i}`;

    if (node.type === 'text') {
      if (node.text.trim()) out.push(<Text key={key} style={styles.paragraph}>{node.text.trim()}</Text>);
      return;
    }

    if (HEADING_TAGS.has(node.tag)) {
      if (isBlank(node.children)) return;
      const level = parseInt(node.tag[1], 10);
      out.push(
        <Text key={key} style={[styles.heading, level <= 2 ? styles.headingLarge : styles.headingSmall]}>
          {renderInline(node.children, key)}
        </Text>
      );
      return;
    }

    switch (node.tag) {
      case 'p': {
        if (isBlank(node.children)) return;
        out.push(
          <Text key={key} style={styles.paragraph}>
            {renderInline(node.children, key)}
          </Text>
        );
        return;
      }
      case 'ul':
      case 'ol': {
        const items = node.children.filter((c): c is Extract<ContentNode, { type: 'element' }> => c.type === 'element' && c.tag === 'li');
        if (items.length === 0) return;
        out.push(
          <View key={key} style={styles.list}>
            {items.map((li, idx) => (
              <View key={`${key}-li-${idx}`} style={styles.listItemRow}>
                <Text style={styles.listBullet}>{node.tag === 'ol' ? `${idx + 1}.` : '•'}</Text>
                <Text style={styles.listItemText}>{renderInline(li.children, `${key}-li-${idx}`)}</Text>
              </View>
            ))}
          </View>
        );
        return;
      }
      case 'figure': {
        const img = findFirst(node.children, 'img');
        if (!img || !img.attribs.src) {
          out.push(...renderBlocks(node.children, resolver, category, key));
          return;
        }
        out.push(<PostImage key={key} src={img.attribs.src} attribs={img.attribs} resolver={resolver} category={category} />);
        const caption = findFirst(node.children, 'figcaption');
        if (caption && !isBlank(caption.children)) {
          out.push(
            <Text key={`${key}-caption`} style={styles.caption}>
              {renderInline(caption.children, `${key}-caption`)}
            </Text>
          );
        }
        return;
      }
      case 'img': {
        if (!node.attribs.src) return;
        out.push(<PostImage key={key} src={node.attribs.src} attribs={node.attribs} resolver={resolver} category={category} />);
        return;
      }
      case 'hr':
        out.push(<View key={key} style={styles.divider} />);
        return;
      case 'a': {
        if (isButtonLink(node.attribs)) {
          out.push(
            <PostButton
              key={key}
              label={flattenText(node).trim()}
              href={node.attribs.href}
              isDownload={isDownloadLink(node.attribs)}
            />
          );
          return;
        }
        if (isBlank(node.children)) return;
        out.push(
          <Text key={key} style={styles.paragraph}>
            {renderInline([node], key)}
          </Text>
        );
        return;
      }
      case 'blockquote': {
        out.push(
          <View key={key} style={styles.quote}>
            {renderBlocks(node.children, resolver, category, key)}
          </View>
        );
        return;
      }
      default:
        out.push(...renderBlocks(node.children, resolver, category, key));
    }
  });

  return out;
}

export default function PostContent({ nodes, imageResolver, category }: { nodes: ContentNode[]; imageResolver: ImageResolver; category: string }) {
  return <View style={styles.container}>{renderBlocks(nodes, imageResolver, category, 'n')}</View>;
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  paragraph: {
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  bold: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  heading: {
    color: colors.foreground,
  },
  headingLarge: {
    fontSize: 20,
    lineHeight: 27,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  headingSmall: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  list: {
    gap: 8,
  },
  listItemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  listBullet: {
    color: colors.accent,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    width: 18,
  },
  listItemText: {
    flex: 1,
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  image: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.secondary,
  },
  caption: {
    marginTop: -6,
    color: colors.muted,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: 14,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    ...shadows.widget,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  downloadButton: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  downloadButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  buttonText: {},
});
