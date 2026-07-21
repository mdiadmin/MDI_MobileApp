import React, { useId } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import SectionDots from '@/components/SectionDots';
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

  const gradientId = useId().replace(/:/g, '');

  return (
    <View style={styles.section}>
      <View style={styles.banner}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.primary} />
              <Stop offset="1" stopColor={colors.primaryDark} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>

        <SectionDots color={colors.accent} />

        <Text style={styles.title}>Support Our Masjid</Text>
        <Text style={styles.subtitle}>Every contribution makes a difference.</Text>

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
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(201,147,58,0.4)',
  },
  title: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11.5,
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 20,
    marginTop: 14,
    zIndex: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
