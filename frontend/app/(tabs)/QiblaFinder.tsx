import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert
} from "react-native";

import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const ASSETS = {
  compassDial: require("../../assets/images/compass-dial.png"),
  compassNeedle: require("../../assets/images/compass-needle.png"),
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COMPASS_SIZE = Math.round(SCREEN_WIDTH * 0.75);

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

const SMOOTHING_ALPHA = 0.6;
const DEAD_ZONE_DEGREES = 0.5;

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function calculateQiblaBearing(lat: number, lng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const deltaLambda = toRad(KAABA_LNG - lng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return normalizeAngle(toDeg(theta));
}

const CACHE_KEY = "qibla_cache_v1";

export default function QiblaFinder() {
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [aligned, setAligned] = useState(false);

  const dialRotation = useSharedValue(0);
  const hapticTriggered = useRef(false);
  const continuousRotationRef = useRef(0);
  const smoothedHeadingContinuousRef = useRef<number | null>(null);

  const qiblaAngleRef = useRef<number | null>(null);

  const setQibla = (angle: number) => {
    qiblaAngleRef.current = angle;
    setQiblaAngle(angle);
  };

  useEffect(() => {
    let headingSubscription: any = null;
    let isCancelled = false;

    async function startHeadingWatch() {
      headingSubscription = await Location.watchHeadingAsync((data) => {
        const rawHeading = data.trueHeading !== -1 ? data.trueHeading : data.magHeading;

        if (smoothedHeadingContinuousRef.current === null) {
          smoothedHeadingContinuousRef.current = rawHeading;
        } else {
          const prevMod = normalizeAngle(smoothedHeadingContinuousRef.current);
          let rawDelta = rawHeading - prevMod;
          if (rawDelta > 180) rawDelta -= 360;
          if (rawDelta < -180) rawDelta += 360;

          if (Math.abs(rawDelta) >= DEAD_ZONE_DEGREES) {
            smoothedHeadingContinuousRef.current += rawDelta * SMOOTHING_ALPHA;
          }
        }

        const smoothedHeading = normalizeAngle(smoothedHeadingContinuousRef.current);
        setHeading(smoothedHeading);

        const rawTarget = normalizeAngle(-smoothedHeading);
        const currentMod = normalizeAngle(continuousRotationRef.current);
        let delta = rawTarget - currentMod;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        const unwrappedTarget = continuousRotationRef.current + delta;
        continuousRotationRef.current = unwrappedTarget;

        dialRotation.value = withTiming(unwrappedTarget, { duration: 120 });

        const target = qiblaAngleRef.current;
        if (target != null) {
          let difference = Math.abs(((target - smoothedHeading + 540) % 360) - 180);
          const isAligned = difference <= 3;
          setAligned(isAligned);

          if (isAligned && !hapticTriggered.current) {
            hapticTriggered.current = true;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (!isAligned) {
            hapticTriggered.current = false;
          }
        }
      });
    }

    async function loadCachedQibla() {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!isCancelled && typeof parsed.qiblaAngle === "number") {
            setQibla(parsed.qiblaAngle);
            setLoading(false);
          }
        }
      } catch {
        // Corrupt or missing cache — safe to ignore, fresh calc below covers it.
      }
    }

    async function resolveFreshLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (qiblaAngleRef.current == null) {
          Alert.alert("Permission Denied", "Location permission is required to calculate the Qibla direction.");
          setLoading(false);
        }
        return;
      }

      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (isCancelled || !location) return;

      const { latitude, longitude } = location.coords;
      const angle = calculateQiblaBearing(latitude, longitude);

      setQibla(angle);
      setLoading(false);

      AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ latitude, longitude, qiblaAngle: angle })
      ).catch(() => {});

      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((refined) => {
          if (isCancelled) return;
          const refinedAngle = calculateQiblaBearing(
            refined.coords.latitude,
            refined.coords.longitude
          );
          setQibla(refinedAngle);
          AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              latitude: refined.coords.latitude,
              longitude: refined.coords.longitude,
              qiblaAngle: refinedAngle,
            })
          ).catch(() => {});
        })
        .catch(() => {});
    }

    async function setup() {
      startHeadingWatch();
      await loadCachedQibla();
      try {
        await resolveFreshLocation();
      } catch (error) {
        console.error(error);
        if (qiblaAngleRef.current == null) {
          Alert.alert("Setup Error", "An error occurred configuring the location system.");
          setLoading(false);
        }
      }
    }

    setup();

    return () => {
      isCancelled = true;
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialRotation.value}deg` }],
    transformOrigin: '50% 50%',
  }));

  if (loading || qiblaAngle == null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 12, fontWeight: "500" }}>Finding Qibla...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qibla Finder</Text>

      <Text style={styles.heading}>Phone Heading: {heading.toFixed(0)}°</Text>
      <Text style={styles.heading}>Qibla Angle: {qiblaAngle.toFixed(0)}°</Text>

      <View style={styles.compassContainer}>
        <Animated.View style={[styles.layer, dialStyle]}>
          <Animated.Image
            source={ASSETS.compassDial}
            style={styles.imageAsset}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.layer} pointerEvents="none">
          <Animated.Image
            source={ASSETS.compassNeedle}
            style={styles.imageAsset}
            resizeMode="contain"
          />
        </View>
      </View>

      <Text style={[styles.status, { color: aligned ? "green" : "#777" }]}>
        {aligned ? "✓ Facing Qibla" : "Rotate phone until the dial aligns under the needle"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4F8",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  heading: {
    fontSize: 15,
    marginBottom: 4,
    color: "#555",
  },
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
  },
  layer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: "absolute",
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  imageAsset: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  status: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
});