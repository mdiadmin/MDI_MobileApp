import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  useWindowDimensions,
  Linking,
  Switch,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ArchHeader from '@/components/ArchHeader';
import { colors } from '@/constants/theme';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY, APP_VERSION, LAST_UPDATED } from '@/constants/legal';
import { usePrayerNotifications } from '@/services/PrayerNotifications';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { width } = useWindowDimensions();
  const logoSize = Math.max(40, Math.round(width / 9));
  const { enabled: notificationsEnabled, busy: notificationsBusy, toggle: toggleNotifications } = usePrayerNotifications();

  const handleToggleNotifications = async (value: boolean) => {
    const result = await toggleNotifications(value);
    if (value && !result) {
      Alert.alert(
        'Notifications Disabled',
        'Prayer time reminders need notification permission. Enable it for this app in your device Settings.'
      );
    }
  };

  // Handler to open the website securely
  const handleOpenWebsite = async () => {
    const url = 'https://daruliman.org';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error("An error occurred while opening the webpage", error);
    }
  };

  return (
    <View style={styles.screen}>
      <ArchHeader title="Settings" eyebrow="Preferences & Legal" icon="cog-outline" />

      {/* Settings Content */}
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Prayer Time Reminders</Text>
              <Text style={styles.rowDescription}>Get notified at each prayer time</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={notificationsBusy}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowTerms(true)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Terms & Conditions</Text>
              <Text style={styles.rowDescription}>Updated {LAST_UPDATED}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowPrivacy(true)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Privacy Policy</Text>
              <Text style={styles.rowDescription}>Updated {LAST_UPDATED}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>App Version</Text>
              <Text style={styles.rowDescription}>v{APP_VERSION}</Text>
            </View>
          </View>

          {/* Changed View to a clickable TouchableOpacity linking to the website */}
          <TouchableOpacity 
            style={styles.row} 
            onPress={handleOpenWebsite}
            activeOpacity={0.7}
          >
            <Image
              style={[{ width: logoSize, height: logoSize }]}
              source={require('@/assets/images/MDI_logo.png')}
            />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Masjid Darul Iman</Text>
              <Text style={styles.rowDescription}>daruliman.org</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => setShowTerms(false)}
              style={styles.modalCloseBtn}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
            <Text style={styles.legalText}>{TERMS_AND_CONDITIONS}</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => setShowPrivacy(false)}
              style={styles.modalCloseBtn}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
            <Text style={styles.legalText}>{PRIVACY_POLICY}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginBottom: 12,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.foreground,
  },
  rowDescription: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.muted,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseBtn: {
    padding: 4,
    width: 40,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.foreground,
  },
  modalBody: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    padding: 20,
  },
  legalText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.foreground,
  },
});