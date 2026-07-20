import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as WebBrowser from 'expo-web-browser';
import GeometricPattern from '@/components/GeometricPattern';
import { colors, shadows } from '@/constants/theme';

const DONATE_URL = 'https://app.irm.io/daruliman.org';

export default function DonateBanner() {
  const handleDonatePress = () => {
    // Opens in SFSafariViewController / Chrome Custom Tabs rather than an
    // in-app WebView: the real domain is visible (important for a page
    // asking for a credit card), and the system password manager / Apple
    // & Google Pay autofill work there but not inside a WebView.
    WebBrowser.openBrowserAsync(DONATE_URL);
  };

  return (
    <View style={styles.section}>
      <View style={styles.banner}>
        <GeometricPattern opacity={0.07} />
        <View style={styles.accentBar} />

        <View style={styles.content}>
          <Text style={styles.title}>Support Our Masjid</Text>
          <Text style={styles.subtitle}>Every contribution makes a difference.</Text>
        </View>

        <TouchableOpacity
          onPress={handleDonatePress}
          style={[styles.button, shadows.donate]}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="heart" size={14} color="#fff" />
          <Text style={styles.buttonText}>Donate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  banner: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  content: {
    flex: 1,
    zIndex: 10,
    paddingLeft: 8,
  },
  title: {
    fontSize: 17,
    color: '#fff',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 3,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    zIndex: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
