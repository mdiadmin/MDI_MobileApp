import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, shadows } from '@/constants/theme';

const PRAYER_TIMES_URL = 'https://portal.ad-din.ca/public/mediumdisplay/542';
const WIDGET_HEIGHT = 320;

export default function PrayerTimesWidget() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Prayer Times</Text>
      </View>

      <View style={[styles.card, shadows.widget]}>
        <WebView
          source={{ uri: PRAYER_TIMES_URL }}
          style={{ width: width - 32, height: WIDGET_HEIGHT }}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    color: colors.primary,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
});
