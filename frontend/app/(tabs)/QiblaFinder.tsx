import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  AppState,
  Linking,
} from "react-native";

import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";

import { Magnetometer, Accelerometer, Gyroscope } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

import ErrorState from "@/components/ErrorState";

const ASSETS = {
  compassDial: require("../../assets/images/compass-dial.png"),
  compassNeedle: require("../../assets/images/compass-needle.png"),
  qiblaIcon: require("../../assets/images/qibla.png"),
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COMPASS_SIZE = Math.round(SCREEN_WIDTH * 0.75);
const QIBLA_ICON_SIZE = 30;
const BEAM_WIDTH = 2;

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function shortestAngleDiff(a: number, b: number) {
  let diff = (b - a) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

const GRAVITY_ALPHA = 0.85;
const MAG_HEADING_ALPHA = 0.85;
const GYRO_TRUST = 0.80;
const DEAD_ZONE_DEGREES = 0.3;

// Phone magnetometers are typically only accurate to +/-5-15 degrees, so a
// tighter threshold makes alignment feel like it never locks in practice.
const ALIGNMENT_THRESHOLD_DEGREES = 5;

// Sensors are sampled at 30Hz. The fusion filter doesn't benefit from a
// faster rate and halving it materially reduces CPU/battery cost.
const SENSOR_UPDATE_INTERVAL_MS = 33;

// The heading readout is only throttled to the eye's ability to read it, not
// to the dial's animation (the dial keeps using the raw fused heading).
const UI_UPDATE_THROTTLE_MS = 250;

// If no gyro sample arrives within this window (gyro absent, or stalled),
// fall back to driving the display straight from the magnetometer.
const GYRO_STALL_TIMEOUT_MS = 500;

// The phone must lie flat for a trustworthy heading. Tilt is measured as the
// angle between gravity and the screen-up axis (0° = perfectly flat face-up).
// Hysteresis (enter/exit) keeps the "lay flat" prompt from flickering.
const FLAT_ENTER_TILT = 12;
const FLAT_EXIT_TILT = 20;

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

const CACHE_KEY = "qibla_cache_v3";

export default function QiblaFinder() {
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [aligned, setAligned] = useState(false);
  const [interference, setInterference] = useState(false);
  const [isFlat, setIsFlat] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const interferenceRef = useRef(false);
  const interferenceClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatRef = useRef(false);

  const dialRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  const continuousRotationRef = useRef(0);
  const qiblaAngleRef = useRef<number | null>(null);
  const alignedRef = useRef(false);

  const declinationRef = useRef<number>(0);

  const magnetometerData = useRef({ x: 0, y: 0, z: 0 });
  const accelerometerData = useRef({ x: 0, y: 0, z: 0 });

  const gravityRef = useRef({ x: 0, y: 0, z: -1 });

  const magHeadingRef = useRef<number | null>(null);

  const fusedHeadingRef = useRef<number | null>(null);

  const lastGyroTimeRef = useRef<number | null>(null);

  const declinationCleanupRef = useRef<null | (() => void)>(null);

  const lastUiUpdateRef = useRef(0);

  const isMountedRef = useRef(true);

  const setQibla = useCallback((angle: number) => {
    qiblaAngleRef.current = angle;
    setQiblaAngle(angle);
  }, []);

  const checkAlignment = useCallback((currentHeading: number) => {
    const target = qiblaAngleRef.current;
    if (target == null) return;

    let difference = Math.abs(((target - currentHeading + 540) % 360) - 180);
    const isAligned = difference <= ALIGNMENT_THRESHOLD_DEGREES;

    if (isAligned !== alignedRef.current) {
      alignedRef.current = isAligned;
      setAligned(isAligned);
      if (isAligned) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, []);

  // Applies a newly-computed fused heading to the dial + (throttled) UI text.
  const applyHeading = useCallback((fusedHeading: number) => {
    const dialTarget = normalizeAngle(-fusedHeading);
    const currentRotation = normalizeAngle(continuousRotationRef.current);
    let rotationDelta = dialTarget - currentRotation;

    if (rotationDelta > 180) rotationDelta -= 360;
    if (rotationDelta < -180) rotationDelta += 360;

    const unwrappedTarget = continuousRotationRef.current + rotationDelta;
    continuousRotationRef.current = unwrappedTarget;

    dialRotation.value = withTiming(unwrappedTarget, {
      duration: 60,
    });

    checkAlignment(fusedHeading);

    const now = Date.now();
    if (now - lastUiUpdateRef.current > UI_UPDATE_THROTTLE_MS) {
      lastUiUpdateRef.current = now;
      setHeading(fusedHeading);
    }
  }, [checkAlignment, dialRotation]);

  // --- One-time location/qibla-angle resolution (mount-scoped, not focus-scoped) ---

  const resolveFreshLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      if (qiblaAngleRef.current == null && isMountedRef.current) {
        setFatalError(
          "Location permission is needed to calculate the Qibla direction."
        );
        setLoading(false);
      }
      return;
    }

    const tempSubRef: { current: any } = { current: null };
    try {
      tempSubRef.current = await Location.watchHeadingAsync((data) => {
        if (data.trueHeading !== -1) {
          let offset = data.trueHeading - data.magHeading;
          if (offset > 180) offset -= 360;
          if (offset < -180) offset += 360;

          declinationRef.current = offset;

          if (tempSubRef.current) {
            tempSubRef.current.remove();
            tempSubRef.current = null;
          }
        }
      });
    } catch (e) {
      console.warn("Could not fetch declination from OS");
    }

    const declinationTimeoutId = setTimeout(() => {
      if (tempSubRef.current) {
        tempSubRef.current.remove();
        tempSubRef.current = null;
      }
    }, 3000);

    declinationCleanupRef.current = () => {
      clearTimeout(declinationTimeoutId);
      if (tempSubRef.current) {
        tempSubRef.current.remove();
        tempSubRef.current = null;
      }
    };

    try {
      let location = await Location.getLastKnownPositionAsync({
        maxAge: 10 * 60 * 1000,
        requiredAccuracy: 1000,
      });
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (!isMountedRef.current || !location) return;

      const { latitude, longitude } = location.coords;
      const angle = calculateQiblaBearing(latitude, longitude);

      setFatalError(null);
      setQibla(angle);
      setLoading(false);

      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          latitude,
          longitude,
          qiblaAngle: angle,
          declination: declinationRef.current,
        })
      );
    } catch (error) {
      console.error("Location error:", error);
      if (qiblaAngleRef.current == null && isMountedRef.current) {
        setFatalError("Could not determine your location. Check your connection and try again.");
        setLoading(false);
      }
    }
  }, [setQibla]);

  const handleRetry = useCallback(() => {
    setFatalError(null);
    setLoading(true);
    resolveFreshLocation();
  }, [resolveFreshLocation]);

  useEffect(() => {
    isMountedRef.current = true;

    async function loadCachedQibla() {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (isMountedRef.current && typeof parsed.qiblaAngle === "number") {
            setQibla(parsed.qiblaAngle);
            if (typeof parsed.declination === "number") {
              declinationRef.current = parsed.declination;
            }
            setLoading(false);
          }
        }
      } catch {
        // Suppress errors
      }
    }

    async function setup() {
      await loadCachedQibla();
      await resolveFreshLocation();
    }

    setup();

    return () => {
      isMountedRef.current = false;
      if (declinationCleanupRef.current) {
        declinationCleanupRef.current();
        declinationCleanupRef.current = null;
      }
    };
  }, [resolveFreshLocation, setQibla]);

  // --- Sensor subscriptions: scoped to screen focus + foreground app state ---

  useFocusEffect(
    useCallback(() => {
      let stopped = false;
      let subs: { remove: () => void }[] = [];

      function updateGravity(accel: { x: number; y: number; z: number }) {
        const E = Math.sqrt(accel.x * accel.x + accel.y * accel.y);
        const dynamicAlpha = E < 0.2 ? 0.95 : GRAVITY_ALPHA;

        gravityRef.current = {
          x: dynamicAlpha * gravityRef.current.x + (1 - dynamicAlpha) * accel.x,
          y: dynamicAlpha * gravityRef.current.y + (1 - dynamicAlpha) * accel.y,
          z: dynamicAlpha * gravityRef.current.z + (1 - dynamicAlpha) * accel.z,
        };
      }

      // The phone is required to lie flat, so gravity ≈ (0,0,±1) and tilt
      // compensation is unnecessary. Gravity is now only used to decide whether
      // the phone is flat enough for the heading to be trusted.
      function updateFlatness() {
        const g = gravityRef.current;
        const gNorm = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) || 1;
        // expo-sensors reports gz ≈ -1 when the phone lies flat face-up, so tilt
        // is the angle between gravity and the -z axis: 0° = flat face-up,
        // 90° = upright, 180° = face-down.
        const cos = Math.min(Math.max(-g.z / gNorm, -1), 1);
        const tiltDeg = Math.acos(cos) * (180 / Math.PI);

        const nextFlat = flatRef.current
          ? tiltDeg <= FLAT_EXIT_TILT
          : tiltDeg <= FLAT_ENTER_TILT;

        if (nextFlat !== flatRef.current) {
          flatRef.current = nextFlat;
          setIsFlat(nextFlat);
        }
      }

      function updateMagHeading() {
        const mag = magnetometerData.current;

        const norm = Math.sqrt(mag.x * mag.x + mag.y * mag.y + mag.z * mag.z);

        // Phone is flat (face-up, gz ≈ -1), so the heading is simply the
        // magnetometer's horizontal (X/Y) projection — no tilt compensation
        // needed. The -x matches the up-vector pointing along -z.
        let rawHeading = Math.atan2(-mag.x, mag.y) * (180 / Math.PI);

        // A healthy Earth magnetic field reads ~25-65 µT. Values outside that band
        // mean a nearby magnet/metal/electronics is distorting the reading, so the
        // heading can't be trusted — surface it as a banner in the UI.
        const hasInterference = norm > 65 || norm < 25;
        if (hasInterference) {
          if (interferenceClearTimerRef.current) {
            clearTimeout(interferenceClearTimerRef.current);
            interferenceClearTimerRef.current = null;
          }
          if (!interferenceRef.current) {
            interferenceRef.current = true;
            setInterference(true);
          }
        } else if (interferenceRef.current && !interferenceClearTimerRef.current) {
          // Debounce clearing so the banner doesn't flicker on brief dips.
          interferenceClearTimerRef.current = setTimeout(() => {
            interferenceRef.current = false;
            setInterference(false);
            interferenceClearTimerRef.current = null;
          }, 1500);
        }

        // Freeze the heading while the phone isn't flat — the reading can't be
        // trusted and the UI shows a "lay flat" prompt instead.
        if (!flatRef.current) return;

        rawHeading += declinationRef.current;
        rawHeading = normalizeAngle(rawHeading);

        if (magHeadingRef.current === null) {
          magHeadingRef.current = rawHeading;
          if (fusedHeadingRef.current === null) {
            fusedHeadingRef.current = rawHeading;
            applyHeading(rawHeading);
          }
        } else {
          const delta = shortestAngleDiff(magHeadingRef.current, rawHeading);
          magHeadingRef.current = normalizeAngle(
            magHeadingRef.current + delta * (1 - MAG_HEADING_ALPHA)
          );
        }
      }

      // Drives the display straight from the (smoothed) magnetometer heading.
      // Used whenever the gyro is absent or has stalled.
      function applyMagnetometerFallback() {
        if (!flatRef.current || magHeadingRef.current == null) return;
        fusedHeadingRef.current = magHeadingRef.current;
        applyHeading(magHeadingRef.current);
      }

      function startSensors() {
        Accelerometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);
        Magnetometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);
        Gyroscope.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);

        const magSub = Magnetometer.addListener((data) => {
          if (stopped) return;
          magnetometerData.current = data;
          updateMagHeading();
        });

        const accelSub = Accelerometer.addListener((raw) => {
          if (stopped) return;
          // expo-sensors reports the accelerometer with the opposite sign on Android
          // compared to iOS. Normalize Android to the iOS convention so the gravity
          // vector (used for flat detection and the gyro's up-axis) is consistent
          // across platforms.
          const data =
            Platform.OS === "android"
              ? { x: -raw.x, y: -raw.y, z: -raw.z }
              : raw;
          accelerometerData.current = data;
          updateGravity(data);
          updateFlatness();
          updateMagHeading();
        });

        const gyroSub = Gyroscope.addListener((data) => {
          if (stopped) return;

          const now = Date.now();
          const lastTime = lastGyroTimeRef.current;
          lastGyroTimeRef.current = now;

          if (lastTime == null || magHeadingRef.current == null) {
            return;
          }

          // Freeze the heading while the phone isn't flat.
          if (!flatRef.current) return;

          const dt = Math.min((now - lastTime) / 1000, 0.2); // clamp in case of a stall
          const g = gravityRef.current;
          const gNorm = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) || 1;
          const upX = g.x / gNorm;
          const upY = g.y / gNorm;
          const upZ = g.z / gNorm;

          let yawRateDeg = (data.x * upX + data.y * upY + data.z * upZ) * (180 / Math.PI);

          // The gravity/up vector is normalized to the iOS convention above, so the
          // yaw projection is flipped on every platform (this is behavior-preserving
          // for the gyro on both iOS and Android).
          yawRateDeg = -yawRateDeg;

          const previousFused = fusedHeadingRef.current ?? magHeadingRef.current;
          const gyroIntegrated = normalizeAngle(previousFused + yawRateDeg * dt);

          const correction = shortestAngleDiff(gyroIntegrated, magHeadingRef.current);
          let fused = normalizeAngle(gyroIntegrated + correction * (1 - GYRO_TRUST));

          const changeSinceLast = Math.abs(shortestAngleDiff(previousFused, fused));
          if (changeSinceLast < DEAD_ZONE_DEGREES) {
            fused = previousFused;
          }

          fusedHeadingRef.current = fused;
          applyHeading(fused);
        });

        subs = [magSub, accelSub, gyroSub];
      }

      function stopSensors() {
        subs.forEach((s) => s.remove());
        subs = [];
        // Reset fusion state so resuming (next focus/foreground) re-syncs
        // cleanly from a fresh magnetometer reading instead of a stale fuse.
        lastGyroTimeRef.current = null;
      }

      startSensors();

      // Gyro watchdog: if no gyro sample has arrived recently (gyro absent,
      // permission-less, or simply stalled), drive the dial from the
      // magnetometer alone instead of freezing.
      const watchdogId = setInterval(() => {
        const last = lastGyroTimeRef.current;
        const stalled = last == null || Date.now() - last > GYRO_STALL_TIMEOUT_MS;
        if (stalled) {
          applyMagnetometerFallback();
        }
      }, GYRO_STALL_TIMEOUT_MS);

      const appStateSub = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active") {
          if (subs.length === 0) startSensors();
        } else {
          stopSensors();
        }
      });

      return () => {
        stopped = true;
        stopSensors();
        appStateSub.remove();
        clearInterval(watchdogId);
        if (interferenceClearTimerRef.current) {
          clearTimeout(interferenceClearTimerRef.current);
          interferenceClearTimerRef.current = null;
        }
      };
    }, [applyHeading])
  );

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialRotation.value}deg` }],
  }));

  // Pulsing ring animation
  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.15, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withTiming(0.1, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (fatalError) {
    return (
      <View style={styles.loading}>
        <ErrorState
          message={fatalError}
          onRetry={handleRetry}
          retryLabel="Try Again"
          onSecondaryAction={() => Linking.openSettings()}
          secondaryLabel="Open Settings"
        />
      </View>
    );
  }

  if (loading || qiblaAngle == null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D4A745" />
        <Text style={styles.loadingText}>Finding Qibla...</Text>
      </View>
    );
  }

  const qiblaDirection = normalizeAngle(qiblaAngle - heading);
  const directionText = qiblaDirection <= 180 ? "Turn Right" : "Turn Left";
  const degreesToTurn = qiblaDirection <= 180 ? qiblaDirection : 360 - qiblaDirection;

  const halfCompass = COMPASS_SIZE / 2;
  const beamLength = halfCompass - 10;

  return (
    <View style={styles.screenBg}>
      <Image
        source={require("../../assets/images/pattern.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="repeat"
      />
      <View style={styles.domeApexDot} />

      <View style={styles.dome}>
      <View style={styles.container}>
      {interference && (
        <View style={styles.interferenceBanner}>
          <Text style={styles.interferenceText}>
            Magnetic interference detected. Move away from metal or electronics
            for an accurate reading.
          </Text>
        </View>
      )}

      <View style={styles.titleRow}>
        <View style={styles.titleLine} />
        <Text style={styles.title}>QIBLA</Text>
        <View style={styles.titleLine} />
      </View>

      <View style={styles.compassContainer}>
        {/* Pulsing ring */}
        <Animated.View style={[styles.pulsingRing, pulseStyle]} />

        {/* Rotating dial layer */}
        <Animated.View style={[styles.layer, dialStyle]}>
          <Animated.Image
            source={ASSETS.compassDial}
            style={styles.imageAsset}
            resizeMode="contain"
          />

          {/* Golden beam from center toward qibla direction */}
          <View
            style={[
              styles.beam,
              {
                height: beamLength,
                transform: [
                  { rotate: `${qiblaAngle}deg` },
                  { translateY: -beamLength / 2 },
                ],
              },
            ]}
          />

          {/* Qibla icon at the calculated bearing on the rim */}
          <View
            style={[
              styles.qiblaIconWrapper,
              {
                transform: [
                  { rotate: `${qiblaAngle}deg` },
                  { translateY: -(halfCompass - QIBLA_ICON_SIZE / 2 - 4) },
                  { rotate: `-${qiblaAngle}deg` },
                ],
              },
            ]}
          >
            <Animated.Image
              source={ASSETS.qiblaIcon}
              style={styles.qiblaIcon}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <View style={styles.layer} pointerEvents="none">
          <Animated.Image
            source={ASSETS.compassNeedle}
            style={styles.needleAsset}
            resizeMode="contain"
          />
        </View>

        {!isFlat && (
          <View style={styles.flatOverlay} pointerEvents="none">
            <Text style={styles.flatOverlayTitle}>Lay Phone Flat</Text>
            <Text style={styles.flatOverlaySubtitle}>
              Place your phone on a flat surface for an accurate reading.
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { fontSize: 16, letterSpacing: 1, marginTop: 10 }]}>
        {!isFlat
          ? "Lay phone flat"
          : aligned
          ? "Aligned with Qibla"
          : `${directionText} ${degreesToTurn.toFixed(0)}°`}
      </Text>
      <Text style={styles.bearingText}>
        Qibla: {qiblaAngle.toFixed(0)}°
      </Text>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenBg: {
    flex: 1,
    backgroundColor: "#BD8B34",
  },
  domeApexDot: {
    position: "absolute",
    top: 3,
    left: "50%",
    marginLeft: -3.5,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#fff",
    opacity: 0.9,
    zIndex: 2,
  },
  dome: {
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 210,
    borderTopRightRadius: 210,
    borderWidth: 4,
    borderColor: "#C9933A",
    overflow: "hidden",
  },
  container: {
    flex: 1,
    backgroundColor: "#0D3B2E",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
  },
  loading: {
    flex: 1,
    backgroundColor: "#0D3B2E",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#D4A745",
  },
  pulsingRing: {
    position: "absolute",
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 2,
    borderColor: "#D4A745",
    zIndex: 0,
  },
  flatOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: "rgba(13, 59, 46, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 5,
  },
  flatOverlayTitle: {
    color: "#D4A745",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  flatOverlaySubtitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.9,
  },
  interferenceBanner: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(212, 71, 71, 0.95)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 10,
  },
  interferenceText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  titleLine: {
    height: 1,
    width: 40,
    backgroundColor: "#D4A745",
    marginHorizontal: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#D4A745",
    letterSpacing: 6,
  },
  bearingText: {
    marginTop: 6,
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.6,
  },
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
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
  },
  beam: {
    position: "absolute",
    width: BEAM_WIDTH,
    backgroundColor: "#D4A745",
    opacity: 0.7,
    borderRadius: 1,
  },
  qiblaIconWrapper: {
    position: "absolute",
    width: QIBLA_ICON_SIZE,
    height: QIBLA_ICON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  qiblaIcon: {
    width: QIBLA_ICON_SIZE,
    height: QIBLA_ICON_SIZE,
  },
  needleAsset: {
    width: "55%",
    height: "55%",
    position: "absolute",
  },
});
