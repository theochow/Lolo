import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import { AuthScreenProps, RootStackParamList } from '../types/navigation';

export default function AuthScreen({}: AuthScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animated values for gradient color animation (inside out)
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const [gradientColors, setGradientColors] = useState(['rgba(200, 180, 255, 0.6)', 'rgba(255, 200, 180, 0.5)']);
  const [borderColor, setBorderColor] = useState('rgba(200, 180, 255, 0.8)');
  
  // Animated value for keyboard animation
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  // Animate gradient colors from inside out
  // Defer animation setup slightly to allow initial render to complete first
  useEffect(() => {
    let listenerId: string | undefined;
    let animationFrameId: number;

    // Use requestAnimationFrame to defer heavy animation setup until after initial paint
    animationFrameId = requestAnimationFrame(() => {
      const gradientColorAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(gradientAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false, // Colors can't use native driver
          }),
          Animated.timing(gradientAnimation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: false,
          }),
        ])
      );

      // Pulsing border animation
      const borderAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(borderPulse, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(borderPulse, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      );

      gradientColorAnimation.start();
      borderAnimation.start();

      // Update colors based on animation value
      listenerId = gradientAnimation.addListener(({ value }) => {
        if (value <= 0.5) {
          // Transitioning from lavender to peach
          const progress = value * 2; // 0 to 1
          const color1 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.6)`;
          const color2 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.5)`;
          setGradientColors([color1, color2]);
          setBorderColor(`rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, ${0.6 + progress * 0.4})`);
        } else {
          // Transitioning from peach back to lavender
          const progress = (value - 0.5) * 2; // 0 to 1
          const color1 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.6)`;
          const color2 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.5)`;
          setGradientColors([color1, color2]);
          setBorderColor(`rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, ${1 - progress * 0.4})`);
        }
      });
    });

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (listenerId !== undefined) {
        gradientAnimation.removeListener(listenerId);
      }
    };
  }, []);

  // Keyboard show/hide animation
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        Animated.timing(keyboardOffset, {
          toValue: -event.endCoordinates.height / 2,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);


  // Interpolate border opacity for pulsing
  const borderOpacity = borderPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    // Sign in only - no signup logic here
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      if (signInError.message.includes('Invalid login credentials') || 
          signInError.message.includes('Invalid email or password') ||
          signInError.message.includes('Email not confirmed')) {
        setError('Invalid email or password');
      } else if (signInError.message.includes('Email logins are disabled')) {
        setError('Email authentication is not enabled. Please enable it in your Supabase dashboard under Authentication → Providers → Email.');
      } else {
        setError(signInError.message);
      }
      return;
    }

    // Success - auth state change will trigger navigation in AppNavigator
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Centered gradient circle */}
      <View style={styles.gradientContainer}>
        <View style={styles.gradientCircle}>
          <BlurView intensity={150} tint="light" style={StyleSheet.absoluteFill}>
            <View style={styles.gradientInner}>
              <LinearGradient
                colors={gradientColors as [string, string]}
                style={{ width: '100%', height: '100%', borderRadius: 150 }}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
          </BlurView>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Lolo</Text>
            <Text style={styles.tagline}>Smarter dating starts within…</Text>
          </View>

          <Animated.View 
            style={[
              styles.form,
              {
                transform: [{ translateY: keyboardOffset }],
              },
            ]}
          >
            <View style={styles.inputContainer}>
              <BlurView intensity={30} tint="light" style={styles.inputBlur}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </BlurView>
            </View>

            <View style={styles.inputContainer}>
              <BlurView intensity={30} tint="light" style={styles.inputBlur}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              </BlurView>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Animated.View
              style={[
                styles.signInButtonContainer,
                {
                  borderColor: borderColor,
                  opacity: borderOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => navigation.navigate('Signup')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.signUpButtonText}>Sign up</Text>
            </TouchableOpacity>
          </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: '28%',
    left: '50%',
    marginLeft: -150,
    overflow: 'visible',
  },
  gradientInner: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 120,
  },
  content: {
    flex: 1,
    zIndex: 1,
    position: 'relative',
  },
  headerSection: {
    marginBottom: 100,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  tagline: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    fontWeight: '400',
  },
  form: {
    width: '100%',
    marginTop: 180,
  },
  inputContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  inputBlur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  input: {
    padding: 16,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    color: '#1A1A1A',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  signInButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  signInButton: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  signUpButton: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});
