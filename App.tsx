import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Load fonts in background - don't block UI
    // Fonts will apply when loaded, but app is usable immediately
    Font.loadAsync({
      'Lora': require('./assets/fonts/Lora-Regular.ttf'),
      'Inter': require('./assets/fonts/Inter_24pt-Regular.ttf'),
    })
      .then(() => {
        setFontsLoaded(true);
        if (__DEV__) {
          console.log('Fonts loaded successfully');
        }
      })
      .catch((error) => {
        if (__DEV__) {
          console.error('Error loading fonts:', error);
        }
        // Continue even if fonts fail to load - will use system fonts
        setFontsLoaded(true);
      });
  }, []);

  // Show UI immediately - fonts will apply when ready
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#FAFAFA" translucent={false} />
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});
