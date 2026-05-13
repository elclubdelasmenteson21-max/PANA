import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SIZES, FONTS } from '@constants/theme';
import { STRINGS } from '@constants/strings';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onActivate?: () => void;
  autoActivate?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onActivate, autoActivate = false }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;
  const textScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const liquidWave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createHeartbeatPulse = () => {
      const sequence = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]);

      return Animated.loop(sequence);
    };

    const heartbeatLoop = createHeartbeatPulse();
    heartbeatLoop.start();

    const ringAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.15,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.6,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    ringAnimation.start();

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();

    const liquidAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(liquidWave, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(liquidWave, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    liquidAnimation.start();

    if (autoActivate && onActivate) {
      const timer = setTimeout(() => {
        onActivate();
      }, 2000);
      return () => {
        heartbeatLoop.stop();
        ringAnimation.stop();
        glowAnimation.stop();
        liquidAnimation.stop();
        clearTimeout(timer);
      };
    }

    return () => {
      heartbeatLoop.stop();
      ringAnimation.stop();
      glowAnimation.stop();
      liquidAnimation.stop();
    };
  }, [autoActivate, onActivate, pulseAnim, ringScale, ringOpacity, glowAnim, liquidWave]);

  const glowInterpolation = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const liquidTranslate = liquidWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  return (
    <TouchableWithoutFeedback onPress={onActivate}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.liquidOverlay,
            {
              transform: [{ translateY: liquidTranslate }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.outerRing,
            {
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />

        <Animated.View
          style={[
            styles.glowRing,
            {
              shadowRadius: glowInterpolation,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight, COLORS.secondary, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            />

            <Animated.View
              style={[
                styles.centerContent,
                {
                  transform: [{ scale: textScale }],
                },
              ]}
            >
              <Text style={styles.panaText}>{STRINGS.appName}</Text>
              <Text style={styles.taglineText}>AQUI HAY PANA{'\n'}PA' RATO!</Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        <Text style={styles.tapHint}>TOCA PARA ACTIVAR</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{STRINGS.footerDeveloper}</Text>
          <Text style={styles.versionText}>{STRINGS.betaVersion}</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const RING_SIZE = 220;
const OUTER_RING_SIZE = 300;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liquidOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderBottomColor: COLORS.primary,
    borderBottomWidth: 0.5,
    opacity: 0.05,
  },
  outerRing: {
    position: 'absolute',
    width: OUTER_RING_SIZE,
    height: OUTER_RING_SIZE,
    borderRadius: OUTER_RING_SIZE / 2,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  glowRing: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  gradientRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    opacity: 0.15,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  panaText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 4,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  taglineText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 2,
    fontWeight: '600',
  },
  tapHint: {
    position: 'absolute',
    bottom: height * 0.15,
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 10,
    opacity: 0.6,
  },
});

export default SplashScreen;
