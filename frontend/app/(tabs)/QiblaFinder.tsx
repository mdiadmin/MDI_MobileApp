import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform
} from "react-native";

import * as Location from "expo-location";

import { Magnetometer, Accelerometer, Gyroscope } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

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
const GYRO_TRUST = 0.96;
const DEAD_ZONE_DEGREES = 0.3;

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

  const dialRotation = useSharedValue(0);

  const continuousRotationRef = useRef(0);
  const qiblaAngleRef = useRef<number | null>(null);
  const alignedRef = useRef(false);

  const declinationRef = useRef<number>(0);

  const magnetometerData = useRef({ x: 0, y: 0, z: 0 });
  const accelerometerData = useRef({ x: 0, y: 0, z: 0 });

  const gravityRef = useRef({ x: 0, y: 0, z: 1 });

  const magHeadingRef = useRef<number | null>(null);

  const fusedHeadingRef = useRef<number | null>(null);

  const lastGyroTimeRef = useRef<number | null>(null);
  const gyroAvailableRef = useRef(true);

  const declinationCleanupRef = useRef<null | (() => void)>(null);

  const setQibla = useCallback((angle: number) => {
    qiblaAngleRef.current = angle;
    setQiblaAngle(angle);
  }, []);

  const checkAlignment = useCallback((currentHeading: number) => {
    const target = qiblaAngleRef.current;
    if (target == null) return;

    let difference = Math.abs(((target - currentHeading + 540) % 360) - 180);
    const isAligned = difference <= 3;

    alignedRef.current = isAligned;
    setAligned(isAligned);
  }, []);

  // Applies a newly-computed fused heading to state + the animated dial.
  const applyHeading = useCallback((fusedHeading: number) => {
    setHeading(fusedHeading);

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
  }, [checkAlignment, dialRotation]);

  useEffect(() => {
    let isCancelled = false;

    Accelerometer.setUpdateInterval(16);
    Magnetometer.setUpdateInterval(16);
    Gyroscope.setUpdateInterval(16);

    function updateGravity(accel: { x: number; y: number; z: number }) {
      
      const E = Math.sqrt(accel.x * accel.x + accel.y * accel.y);
      const dynamicAlpha = E < 0.2 ? 0.95 : GRAVITY_ALPHA;
      
      gravityRef.current = {
        x: dynamicAlpha * gravityRef.current.x + (1 - dynamicAlpha) * accel.x,
        y: dynamicAlpha * gravityRef.current.y + (1 - dynamicAlpha) * accel.y,
        z: dynamicAlpha * gravityRef.current.z + (1 - dynamicAlpha) * accel.z,
      };
    }

    function tiltCompensatedWorldMag(
      g: { x: number; y: number; z: number },
      mag: { x: number; y: number; z: number }
    ) {
      const norm = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
      if (norm === 0) return null;

      // Normalize gravity vector
      const gx = g.x / norm;
      const gy = g.y / norm;
      const gz = g.z / norm;

      const E = Math.sqrt(gx * gx + gy * gy);

      // If the phone is nearly flat, we need special handling
      if (E < 0.1) {
        // When flat, use a simpler 2D compass approach
        // Determine orientation based on the sign of gz
        if (gz < 0) {
          // Phone is facing down - flip the axes
          return { x: -mag.x, y: -mag.y };
        } else {
          // Phone is facing up - standard flat compass
          return { x: mag.x, y: mag.y };
        }
      }

      const Ex = gx / E;
      const Ey = gy / E;
      const worldX = Ex * gz * mag.x + Ey * gz * mag.y - E * mag.z;
      const worldY = -Ey * mag.x + Ex * mag.y;

      return { x: worldX, y: worldY };
    }

    function updateMagHeading() {
      const mag = magnetometerData.current;
      const worldMag = tiltCompensatedWorldMag(gravityRef.current, mag);
      if (worldMag == null) return;

      let rawHeading = Math.atan2(worldMag.y, worldMag.x) * (180 / Math.PI);

      if (Platform.OS === "ios") {
        rawHeading = -rawHeading;
      }

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

    const magSub = Magnetometer.addListener((data) => {
      if (isCancelled) return;
      magnetometerData.current = data;
      updateMagHeading();
    });

    const accelSub = Accelerometer.addListener((data) => {
      if (isCancelled) return;
      accelerometerData.current = data;
      updateGravity(data);
      updateMagHeading();
    });

    const gyroSub = Gyroscope.addListener((data) => {
      if (isCancelled) return;

      const now = Date.now();
      const lastTime = lastGyroTimeRef.current;
      lastGyroTimeRef.current = now;

      if (lastTime == null || magHeadingRef.current == null) {
        return; 
      }

      const dt = Math.min((now - lastTime) / 1000, 0.2); // clamp in case of a stall
      const g = gravityRef.current;
      const gNorm = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) || 1;
      const upX = g.x / gNorm;
      const upY = g.y / gNorm;
      const upZ = g.z / gNorm;

      let yawRateDeg = (data.x * upX + data.y * upY + data.z * upZ) * (180 / Math.PI);

      if (Platform.OS === "ios") {
        yawRateDeg = -yawRateDeg;
      }

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

    Gyroscope.isAvailableAsync()
      .then((available) => {
        gyroAvailableRef.current = available;
        if (!available) {
          console.warn("Gyroscope unavailable, falling back to magnetometer-only heading.");
        }
      })
      .catch(() => {
        gyroAvailableRef.current = false;
      });

    async function loadCachedQibla() {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!isCancelled && typeof parsed.qiblaAngle === "number") {
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

    async function fetchDeclinationOffset() {
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

      const timeoutId = setTimeout(() => {
        if (tempSubRef.current) {
          tempSubRef.current.remove();
          tempSubRef.current = null;
        }
      }, 3000);

      declinationCleanupRef.current = () => {
        clearTimeout(timeoutId);
        if (tempSubRef.current) {
          tempSubRef.current.remove();
          tempSubRef.current = null;
        }
      };
    }

    async function resolveFreshLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (qiblaAngleRef.current == null) {
          Alert.alert(
            "Permission Required",
            "Location permission is needed to calculate Qibla direction."
          );
          setLoading(false);
        }
        return;
      }

      fetchDeclinationOffset();

      try {
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

        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            latitude,
            longitude,
            qiblaAngle: angle,
            declination: declinationRef.current
          })
        );

      } catch (error) {
        console.error('Location error:', error);
        if (qiblaAngleRef.current == null) {
          Alert.alert("Error", "Could not determine your location.");
          setLoading(false);
        }
      }
    }

    async function setup() {
      await loadCachedQibla();
      await resolveFreshLocation();
    }

    setup();

    return () => {
      isCancelled = true;
      magSub.remove();
      accelSub.remove();
      gyroSub.remove();
      if (declinationCleanupRef.current) {
        declinationCleanupRef.current();
        declinationCleanupRef.current = null;
      }
    };
  }, [applyHeading, setQibla]);

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialRotation.value}deg` }],
  }));

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
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleLine} />
        <Text style={styles.title}>QIBLA</Text>
        <View style={styles.titleLine} />
      </View>

      <View style={styles.compassContainer}>
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
      </View>

      <Text style={[styles.title, { fontSize: 16, letterSpacing: 1, marginTop: 10 }]}>
        {aligned ? "Aligned with Qibla" : `${directionText} ${degreesToTurn.toFixed(0)}°`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D3B2E",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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