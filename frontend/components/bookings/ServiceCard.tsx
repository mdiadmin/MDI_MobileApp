import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, shadows } from '@/constants/theme';

type ServiceCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  // External link-outs get an "open in new" affordance instead of a chevron.
  external?: boolean;
  tint?: 'primary' | 'accent';
};

export default function ServiceCard({
  icon,
  title,
  description,
  onPress,
  external,
  tint = 'primary',
}: ServiceCardProps) {
  const iconColor = tint === 'accent' ? colors.accent : colors.primary;
  const iconBg = tint === 'accent' ? colors.accentBg : colors.secondary;

  return (
    <TouchableOpacity style={[styles.card, shadows.action]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <MaterialCommunityIcons
        name={external ? 'open-in-new' : 'chevron-right'}
        size={external ? 16 : 20}
        color={colors.muted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 13,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
