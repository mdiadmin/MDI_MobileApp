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
import * as Haptics from "expo-haptics";
import { Magnetometer, Accelerometer } from "expo-sensors";
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

const SMOOTHING_ALPHA = 0.15;
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
  const hapticTriggered = useRef(false);
  const continuousRotationRef = useRef(0);
  const smoothedHeadingRef = useRef<number | null>(null);
  const qiblaAngleRef = useRef<number | null>(null);
  const alignedRef = useRef(false);

  // New Ref to hold the geographic true north offset
  const declinationRef = useRef<number>(0);

  const magnetometerData = useRef({ x: 0, y: 0, z: 0 });
  const accelerometerData = useRef({ x: 0, y: 0, z: 0 });
  
  const rotationMatrix = useRef<number[][]>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);

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
    
    if (isAligned && !hapticTriggered.current) {
      hapticTriggered.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (!isAligned) {
      hapticTriggered.current = false;
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    Accelerometer.setUpdateInterval(16);
    Magnetometer.setUpdateInterval(16);

    const magSub = Magnetometer.addListener((data) => {
      magnetometerData.current = data;
      updateHeading();
    });

    const accelSub = Accelerometer.addListener((data) => {
      accelerometerData.current = data;
      updateRotationMatrix(data);
      updateHeading();
    });

    function updateRotationMatrix(accel: { x: number; y: number; z: number }) {
      const norm = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
      if (norm === 0) return;

      const gx = accel.x / norm;
      const gy = accel.y / norm;
      const gz = accel.z / norm;

      const E = Math.sqrt(gx * gx + gy * gy);
      
      if (E > 0.001) { 
        const Ex = gx / E;
        const Ey = gy / E;
        
        rotationMatrix.current = [
          [Ex * gz, Ey * gz, -E],
          [-Ey, Ex, 0],
          [gx, gy, gz]
        ];
      } else {
        rotationMatrix.current = [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1]
        ];
      }
    }

    function updateHeading() {
      if (isCancelled) return;

      const mag = magnetometerData.current;
      const R = rotationMatrix.current;

      const worldMagX = R[0][0] * mag.x + R[0][1] * mag.y + R[0][2] * mag.z;
      const worldMagY = R[1][0] * mag.x + R[1][1] * mag.y + R[1][2] * mag.z;

      let rawHeading = Math.atan2(worldMagY, worldMagX) * (180 / Math.PI);
      
      if (Platform.OS === 'ios') {
        rawHeading = -rawHeading;
      }
      
      rawHeading += declinationRef.current;
      
      rawHeading = normalizeAngle(rawHeading);

      if (smoothedHeadingRef.current === null) {
        smoothedHeadingRef.current = rawHeading;
      } else {
        let delta = rawHeading - smoothedHeadingRef.current;
        
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        if (Math.abs(delta) > DEAD_ZONE_DEGREES) {
          smoothedHeadingRef.current = normalizeAngle(
            smoothedHeadingRef.current + delta * SMOOTHING_ALPHA
          );
        }
      }

      const smoothedHeading = smoothedHeadingRef.current;
      setHeading(smoothedHeading);

      const dialTarget = normalizeAngle(-smoothedHeading);
      const currentRotation = normalizeAngle(continuousRotationRef.current);
      let rotationDelta = dialTarget - currentRotation;
      
      if (rotationDelta > 180) rotationDelta -= 360;
      if (rotationDelta < -180) rotationDelta += 360;

      const unwrappedTarget = continuousRotationRef.current + rotationDelta;
      continuousRotationRef.current = unwrappedTarget;

      dialRotation.value = withTiming(unwrappedTarget, { 
        duration: 100 
      });

      checkAlignment(smoothedHeading);
    }

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
      let tempSub: any = null;
      try {
        tempSub = await Location.watchHeadingAsync((data) => {
          if (data.trueHeading !== -1) {
            let offset = data.trueHeading - data.magHeading;
            if (offset > 180) offset -= 360;
            if (offset < -180) offset += 360;
            
            declinationRef.current = offset;
            
            if (tempSub) {
              tempSub.remove();
              tempSub = null;
            }
          }
        });

        setTimeout(() => {
          if (tempSub) {
            tempSub.remove();
          }
        }, 3000);
      } catch (e) {
        console.warn("Could not fetch declination from OS");
      }
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

        // Cache the result WITH the declination
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
    };
  }, [checkAlignment, setQibla]);

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialRotation.value}deg` }],
  }));

  if (loading || qiblaAngle == null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Finding Qibla...</Text>
      </View>
    );
  }

  const qiblaDirection = normalizeAngle(qiblaAngle - heading);
  const directionText = qiblaDirection <= 180 ? "Turn Left" : "Turn Right";
  const degreesToTurn = qiblaDirection <= 180 ? qiblaDirection : 360 - qiblaDirection;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qibla Finder</Text>

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

      <View style={styles.infoContainer}>
        <Text style={[styles.status, { color: aligned ? "#4CAF50" : "#FF9800" }]}>
          {aligned 
            ? "✓ Facing Qibla" 
            : `${directionText} ${degreesToTurn.toFixed(0)}°`
          }
        </Text>
        
        <Text style={styles.detailText}>
          Qibla: {qiblaAngle.toFixed(0)}° | Heading: {heading.toFixed(0)}°
        </Text>
        
        <Text style={styles.detailText}>
          Difference: {qiblaDirection.toFixed(1)}°
        </Text>
      </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 30,
    color: "#333",
  },
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
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
  infoContainer: {
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 250,
  },
  status: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
});