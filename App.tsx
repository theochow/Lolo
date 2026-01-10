import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Lora': require('./assets/fonts/Lora-Regular.ttf'),
          'Inter': require('./assets/fonts/Inter_24pt-Regular.ttf'),
        });
        setFontsLoaded(true);
        console.log('Fonts loaded successfully');
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Continue even if fonts fail to load - will use system fonts
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#FAFAFA" translucent={false} />
      <AppNavigator />
    </NavigationContainer>
  );
}
