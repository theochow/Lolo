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
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import { RootStackParamList } from '../types/navigation';

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState('rgba(200, 180, 255, 0.6)');
  
  // Lazy initialize Dimensions - only called when component mounts, not at module level
  const screenDimensions = useRef<{ height: number; width: number } | null>(null);
  if (!screenDimensions.current) {
    screenDimensions.current = Dimensions.get('window');
  }
  const screenHeight = screenDimensions.current.height;
  const screenWidth = screenDimensions.current.width;
  
  // Circle animation for smooth transition from login
  const circleSize = useRef(new Animated.Value(300)).current;
  const circleTop = useRef(new Animated.Value(screenHeight * 0.28)).current; // Start from login position
  const [gradientColors, setGradientColors] = useState<[string, string]>(['rgba(200, 180, 255, 0.6)', 'rgba(255, 200, 180, 0.5)']);

  useFocusEffect(
    React.useCallback(() => {
      // Animate circle to signup position (slightly higher)
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(circleSize, {
          toValue: 300,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(circleTop, {
          toValue: screenHeight * 0.25,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
      
      return () => {
        contentOpacity.setValue(0);
      };
    }, [screenHeight])
  );

  useEffect(() => {
    let listenerId: string | undefined;
    let animationFrameId: number;

    // Defer animation setup to allow initial render to complete first
    animationFrameId = requestAnimationFrame(() => {
      const gradientColorAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(gradientAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
          }),
          Animated.timing(gradientAnimation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: false,
          }),
        ])
      );

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

      listenerId = gradientAnimation.addListener(({ value }) => {
        if (value <= 0.5) {
          const progress = value * 2;
          const color1 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.6)`;
          const color2 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.5)`;
          setGradientColors([color1, color2]);
          setBorderColor(`rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, ${0.6 + progress * 0.4})`);
        } else {
          const progress = (value - 0.5) * 2;
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

  const borderOpacity = borderPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const handleSignup = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    // Sanitize email: ensure it's a string, then trim and lowercase
    const rawEmail = email;
    const sanitizedEmail = String(rawEmail).trim().toLowerCase();
    const sanitizedPassword = String(password);

    // Debug logging: verify input shape before signUp
    if (__DEV__) {
      console.log('=== SIGNUP DEBUG ===');
      console.log('Raw email type:', typeof rawEmail);
      console.log('Raw email value:', rawEmail);
      console.log('Sanitized email type:', typeof sanitizedEmail);
      console.log('Sanitized email value:', sanitizedEmail);
      console.log('Password type:', typeof sanitizedPassword);
      console.log('Password length:', sanitizedPassword.length);
      console.log('SignUp call arguments:', {
        email: sanitizedEmail,
        password: '***',
      });
    }

    try {
      // Call signUp exactly once with email + password (no OTP/magic-link)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (__DEV__) {
        console.log('Signup successful, user:', data.user?.id);
      }

      // Signup successful → user is authenticated
      // AppNavigator's auth state change listener will detect
      // the new session and navigate to onboarding automatically
      // Do NOT create profile here - that happens in onboarding
      setLoading(false);
    } catch (err: any) {
      if (__DEV__) {
        console.error('Signup error:', err);
      }
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.gradientContainer}>
        <Animated.View 
          style={[
            styles.gradientCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: 150,
              top: Animated.subtract(circleTop, 150),
              left: screenWidth / 2,
              marginLeft: -150,
            },
          ]}
        >
          <BlurView intensity={150} tint="light" style={StyleSheet.absoluteFill}>
            <View style={styles.gradientInner}>
              <LinearGradient
                colors={gradientColors}
                style={{ width: '100%', height: '100%', borderRadius: 150 }}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
          </BlurView>
        </Animated.View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          <Text style={styles.tagline}>Love, backed by science.</Text>

          <View style={styles.form}>
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
                styles.createButtonContainer,
                {
                  borderColor: borderColor,
                  opacity: borderOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text style={styles.buttonText}>Create account</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
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
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
    position: 'relative',
  },
  tagline: {
    fontSize: 24,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 48,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  inputBlur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  createButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  createButton: {
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
});

