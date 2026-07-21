import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getCategoryStyle } from '@/constants/announcementsCategories';

// Shown wherever an image would be but isn't — no featured image at all,
// or (offline) an image that isn't in the local cache. Deliberately the
// same look in both cases so a gap in the offline cache reads as "no photo"
// rather than "broken load."
export default function CategoryPlaceholder({
  category,
  iconSize = 28,
  style,
}: {
  category: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const categoryStyle = getCategoryStyle(category);
  return (
    <View style={[styles.container, { backgroundColor: categoryStyle.bg }, style]}>
      <MaterialCommunityIcons name={categoryStyle.icon} size={iconSize} color={categoryStyle.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
