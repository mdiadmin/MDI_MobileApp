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
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_NAME, TERMS_AND_CONDITIONS, PRIVACY_POLICY } from "@/constants/legal";
import { colors } from "@/constants/theme";
import PrayerNotifications from "@/services/PrayerNotifications";

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
                  This app uses your device location to calculate prayer times and
                  Qibla direction. No personal data is collected or stored. By
                  using this app, you agree to our Terms & Conditions and Privacy
                  Policy.
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
  });

  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

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

  useEffect(() => {
    if (fontsLoaded && termsAccepted !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, termsAccepted]);

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

  if (!termsAccepted) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <TermsAcceptanceModal onAccept={handleAccept} />
      </>
    );
  }

  return (
    <>
      <PrayerNotifications />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
