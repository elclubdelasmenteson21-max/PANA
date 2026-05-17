import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@constants/theme';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>PANA</Text>
    </View>
  );
};

SplashScreen.displayName = 'SplashScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF6B00',
  },
});

export default SplashScreen;
