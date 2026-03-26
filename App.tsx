import React, { Component, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync().catch(() => {
  // preventAutoHideAsync can fail if splash screen is already hidden — ignore
});

// Error boundary catches any unhandled render errors and shows a message
// instead of a blank white screen
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.error('App crashed with error:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            Please close and reopen the app. If the issue persists, reinstall Lolo.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'Lora': require('./assets/fonts/Lora-Regular.ttf'),
      'Lora-Bold': require('./assets/fonts/Lora-Bold.ttf'),
      'Lora-SemiBold': require('./assets/fonts/Lora-SemiBold.ttf'),
      'Inter': require('./assets/fonts/Inter_24pt-Regular.ttf'),
      'Inter-Medium': require('./assets/fonts/Inter_24pt-Medium.ttf'),
      'Inter-SemiBold': require('./assets/fonts/Inter_24pt-SemiBold.ttf'),
      'Inter-Bold': require('./assets/fonts/Inter_24pt-Bold.ttf'),
    })
      .catch((error) => {
        // If fonts fail to load, continue with system fonts rather than crashing
        if (__DEV__) console.error('Font loading error:', error);
      })
      .finally(() => {
        setFontsLoaded(true);
        SplashScreen.hideAsync().catch(() => {});
      });
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#FAFAFA" translucent={false} />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
