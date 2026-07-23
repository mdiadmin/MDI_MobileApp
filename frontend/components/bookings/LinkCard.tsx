import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, shadows } from '@/constants/theme';

export type LinkRowData = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  // External link-outs show an "open in new" glyph instead of a chevron.
  external?: boolean;
};

// A single white card holding stacked rows separated by hairline dividers.
export default function LinkCard({ rows }: { rows: LinkRowData[] }) {
  return (
    <View style={[styles.card, shadows.action]}>
      {rows.map((row, i) => (
        <View key={row.title}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <TouchableOpacity style={styles.row} onPress={row.onPress} activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={row.icon} size={20} color={colors.accent} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.description}>{row.description}</Text>
            </View>
            <MaterialCommunityIcons
              name={row.external ? 'open-in-new' : 'chevron-right'}
              size={row.external ? 16 : 20}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBg,
  },
  body: { flex: 1 },
  title: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.foreground,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.muted,
    marginTop: 2,
  },
});
