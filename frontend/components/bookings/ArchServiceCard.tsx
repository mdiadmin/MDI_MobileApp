import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Polygon } from 'react-native-svg';
import { colors, shadows } from '@/constants/theme';

type ArchServiceCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
};

// Small gold pediment (a peaked triangle) that sits above the card, echoing
// the pointed arch motif of the header.
function Pediment() {
  return (
    <Svg width={26} height={11} viewBox="0 0 26 11" style={styles.pediment}>
      <Polygon points="13,0 26,11 0,11" fill={colors.accent} />
    </Svg>
  );
}

export default function ArchServiceCard({
  icon,
  title,
  description,
  onPress,
}: ArchServiceCardProps) {
  return (
    <View style={styles.column}>
      <Pediment />
      <TouchableOpacity style={[styles.card, shadows.action]} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    alignItems: 'center',
  },
  pediment: {
    // Nudge down so its base tucks under the card's top edge.
    marginBottom: -1,
    zIndex: 1,
  },
  card: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: colors.foreground,
    textAlign: 'center',
  },
  description: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});
