import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { VoiceService } from '@services/voice';
import { COLORS } from '@constants/theme';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    const ring = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );
    ring.start();

    return () => {
      pulse.stop();
      ring.stop();
    };
  }, [pulseAnim, ringAnim]);

  const handlePress = async () => {
    const voiceService = VoiceService.getInstance();
    await voiceService.speak(
      'Hola mi PANA, soy la IA de Negocios creada y desarrollada por ALVARO TÁBATA, especialmente para los VENEZOLANOS. ¿En qué puedo servirte?',
    );
    navigation.replace('Main', { screen: 'AI' });
  };

  const ringRotate = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#000000', '#0A0A0A', '#1A0A00']} style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.ringOuter,
            {
              transform: [{ scale: pulseAnim }, { rotate: ringRotate }],
            },
          ]}>
          <LinearGradient
            colors={['#FF6B00', '#FF8533', '#FF6B00']}
            style={styles.ringGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        <View style={styles.innerCircle}>
          <Text style={styles.title}>PANA</Text>
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  ringOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  innerCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 4,
  },
});

export default SplashScreen;
