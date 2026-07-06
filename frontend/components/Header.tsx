import React from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GeometricPattern from '@/components/GeometricPattern';
import MosqueIcon from '@/components/MosqueIcon';
import { colors } from '@/constants/theme';

const Header = () => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar
        animated
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <GeometricPattern opacity={0.09} />

        <View style={styles.logoSection}>
          <MosqueIcon />
          <Text style={styles.masjidName}>Masjid Darul Iman</Text>
          <Text style={styles.subtitle}>Islamic Centre of Markham</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.primary,
    paddingBottom: 28,
  },
  logoSection: {
    zIndex: 10,
    alignItems: 'center',
  },
  masjidName: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 21,
    lineHeight: 26,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});

export default Header;
