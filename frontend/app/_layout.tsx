// @ts-ignore: Side-effect CSS import without type declarations
import "@/global.css";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  DMSerifDisplay_400Regular,
} from "@expo-google-fonts/dm-serif-display";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Amiri_400Regular,
  Amiri_700Bold,
} from "@expo-google-fonts/amiri";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_NAME, TERMS_AND_CONDITIONS, PRIVACY_POLICY } from "@/constants/legal";
import { colors } from "@/constants/theme";
import PrayerNotifications, {
  hasPrayerNotificationDecision,
  setPrayerNotificationsEnabled,
} from "@/services/PrayerNotifications";
import { initializeOneSignal } from "@/services/OneSignal";

SplashScreen.preventAutoHideAsync();

const TERMS_ACCEPTED_KEY = "@terms_accepted";

function TermsAcceptanceModal({ onAccept }: { onAccept: () => void }) {
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showFullPrivacy, setShowFullPrivacy] = useState(false);
  const { width } = useWindowDimensions();
  const logoSize = Math.max(40, Math.round(width / 4));

  return (
    <>
      <Modal visible transparent animationType="fade" statusBarTranslucent>
        <SafeAreaView style={acceptStyles.container}>
          <View style={acceptStyles.card}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image
                style={[acceptStyles.logo, { width: logoSize, height: logoSize }]}
                source={require('@/assets/images/MDI_logo.png')}
              />
              <Text style={acceptStyles.title}>{APP_NAME}</Text>
              <Text style={acceptStyles.subtitle}>
                Welcome to our community app
              </Text>

              <View style={acceptStyles.summaryBox}>
                <Text style={acceptStyles.summaryTitle}>
                  Before you continue
                </Text>
                <Text style={acceptStyles.summaryText}>
                  This app uses your device location to determine the Qibla
                  direction, and — if you enable notifications — a push token
                  to deliver prayer-time reminders and masjid announcements.
                  See the Privacy Policy for details. By using this app, you
                  agree to our Terms & Conditions and Privacy Policy.
                </Text>
              </View>

              <TouchableOpacity
                style={acceptStyles.linkRow}
                onPress={() => setShowFullTerms(true)}
                activeOpacity={0.7}
              >
                <Text style={acceptStyles.linkText}>
                  Read Terms & Conditions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={acceptStyles.linkRow}
                onPress={() => setShowFullPrivacy(true)}
                activeOpacity={0.7}
              >
                <Text style={acceptStyles.linkText}>
                  Read Privacy Policy
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={acceptStyles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.85}
            >
              <Text style={acceptStyles.acceptButtonText}>I Accept</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Full Terms Modal */}
      <Modal
        visible={showFullTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFullTerms(false)}
      >
        <View style={acceptStyles.fullModal}>
          <View style={acceptStyles.fullModalHeader}>
            <TouchableOpacity
              onPress={() => setShowFullTerms(false)}
              style={acceptStyles.fullModalClose}
            >
              <Text style={acceptStyles.fullModalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={acceptStyles.fullModalTitle}>
              Terms & Conditions
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView
            style={acceptStyles.fullModalBody}
            contentContainerStyle={acceptStyles.fullModalContent}
          >
            <Text style={acceptStyles.legalText}>{TERMS_AND_CONDITIONS}</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Full Privacy Modal */}
      <Modal
        visible={showFullPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFullPrivacy(false)}
      >
        <View style={acceptStyles.fullModal}>
          <View style={acceptStyles.fullModalHeader}>
            <TouchableOpacity
              onPress={() => setShowFullPrivacy(false)}
              style={acceptStyles.fullModalClose}
            >
              <Text style={acceptStyles.fullModalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={acceptStyles.fullModalTitle}>Privacy Policy</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView
            style={acceptStyles.fullModalBody}
            contentContainerStyle={acceptStyles.fullModalContent}
          >
            <Text style={acceptStyles.legalText}>{PRIVACY_POLICY}</Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function NotificationSoftPrompt({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const respond = async (enable: boolean) => {
    setBusy(true);
    try {
      await setPrayerNotificationsEnabled(enable);
    } finally {
      setBusy(false);
      onDone();
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <SafeAreaView style={acceptStyles.container}>
        <View style={acceptStyles.card}>
          <Text style={acceptStyles.title}>Stay Connected</Text>
          <View style={acceptStyles.summaryBox}>
            <Text style={acceptStyles.summaryTitle}>Get notified at each prayer time</Text>
            <Text style={acceptStyles.summaryText}>
              Turn on notifications to receive a reminder for each of the five
              daily prayers, and occasional announcements from the masjid. You
              can change this anytime in Settings.
            </Text>
          </View>

          <TouchableOpacity
            style={acceptStyles.acceptButton}
            onPress={() => respond(true)}
            activeOpacity={0.85}
            disabled={busy}
          >
            <Text style={acceptStyles.acceptButtonText}>Enable Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={acceptStyles.linkRow}
            onPress={() => respond(false)}
            activeOpacity={0.7}
            disabled={busy}
          >
            <Text style={acceptStyles.linkText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const acceptStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
  },
  
  title: {
    fontSize: 22,
    fontFamily: "DMSerifDisplay_400Regular",
    color: colors.foreground,
    textAlign: "center",
    marginBottom: 4,
  },
  logo: {
    alignSelf: 'center',
    zIndex: 20
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: colors.muted,
    textAlign: "center",
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_700Bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "PlusJakartaSans_400Regular",
    color: colors.primaryLight,
  },
  linkRow: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  linkText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  acceptButtonText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#fff",
  },
  fullModal: {
    flex: 1,
    backgroundColor: colors.card,
  },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fullModalClose: {
    padding: 4,
    width: 40,
  },
  fullModalCloseText: {
    fontSize: 18,
    color: colors.foreground,
  },
  fullModalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: colors.foreground,
  },
  fullModalBody: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullModalContent: {
    padding: 20,
  },
  legalText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "PlusJakartaSans_400Regular",
    color: colors.foreground,
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  // null = still checking; true = the soft prompt still needs to be shown.
  const [notificationPromptNeeded, setNotificationPromptNeeded] = useState<boolean | null>(null);

  const checkAcceptance = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
      setTermsAccepted(value === "true");
    } catch {
      setTermsAccepted(false);
    }
  }, []);

  useEffect(() => {
    checkAcceptance();
  }, [checkAcceptance]);

  // Both OneSignal registration and the (single) notification permission
  // prompt are gated behind terms acceptance, so a new user never sees an OS
  // permission dialog before they've had a chance to read what the app does.
  useEffect(() => {
    if (!termsAccepted) return;
    initializeOneSignal();
    hasPrayerNotificationDecision().then((decided) => {
      setNotificationPromptNeeded(!decided);
    });
  }, [termsAccepted]);

  useEffect(() => {
    const notificationStepResolved = !termsAccepted || notificationPromptNeeded !== null;
    if (fontsLoaded && termsAccepted !== null && notificationStepResolved) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, termsAccepted, notificationPromptNeeded]);

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, "true");
      setTermsAccepted(true);
    } catch {
      setTermsAccepted(true);
    }
  };

  if (!fontsLoaded || termsAccepted === null) {
    return null;
  }

  // SafeAreaProvider lives here at the root so every screen — including the
  // Terms/notification modals above the tab navigator — has an ancestor
  // provider for useSafeAreaInsets()/SafeAreaView, not just the home tab.
  return (
    <SafeAreaProvider>
      {!termsAccepted ? (
        <>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <TermsAcceptanceModal onAccept={handleAccept} />
        </>
      ) : notificationPromptNeeded === null ? null : notificationPromptNeeded ? (
        <>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <NotificationSoftPrompt onDone={() => setNotificationPromptNeeded(false)} />
        </>
      ) : (
        <>
          <PrayerNotifications />
          <Stack screenOptions={{ headerShown: false }} />
        </>
      )}
    </SafeAreaProvider>
  );
}
