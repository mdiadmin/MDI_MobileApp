import React from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Image,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GeometricPattern from '@/components/GeometricPattern';
import { colors } from '@/constants/theme';

const Header = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logoSize = Math.max(40, Math.round(width / 4));

  return (
    <>
      <StatusBar
        animated
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <GeometricPattern opacity={0.39} />

        <Image
          style={[styles.logo, { width: logoSize, height: logoSize }]}
          source={require('@/assets/images/MDI_logo.png')}
        />
        <Text style={styles.masjidName}>Masjid Darul Iman</Text>
        <Text style={styles.subtitle}>Islamic Centre of Markham</Text>
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

  logo: {
    alignSelf: 'center',
    zIndex: 20
  }
});

export default Header;
