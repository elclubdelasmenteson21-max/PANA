import React from 'react';
import { StatusBar, LogBox, View } from 'react-native';

import { AuthProvider } from '@context/AuthContext';
import AppNavigator from '@navigation/AppNavigator';
import { COLORS } from '@constants/theme';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

const App: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1 }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
          translucent={false}
        />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </View>
    </View>
  );
};

export default App;
