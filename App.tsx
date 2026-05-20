import React from 'react';
import { StatusBar, View } from 'react-native';

import AppNavigator from '@navigation/AppNavigator';
import { COLORS } from '@constants/theme';

const App: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} translucent={false} />
      <AppNavigator />
    </View>
  );
};

export default App;
