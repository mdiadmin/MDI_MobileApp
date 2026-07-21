import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getCategoryStyle } from '@/constants/announcementsCategories';

function CategoryPillImpl({ category }: { category: string }) {
  const style = getCategoryStyle(category);
  return (
    <View style={[styles.pill, { backgroundColor: style.bg }]}>
      <MaterialCommunityIcons name="tag-outline" size={9} color={style.text} />
      <Text style={[styles.text, { color: style.text }]}>{category}</Text>
    </View>
  );
}

export const CategoryPill = React.memo(CategoryPillImpl);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontSize: 10,
    letterSpacing: 0.4,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
