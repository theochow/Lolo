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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import { RootStackParamList } from '../types/navigation';
import AnimatedCircle from '../components/AnimatedCircle';

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

  useFocusEffect(
    React.useCallback(() => {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      return () => {
        contentOpacity.setValue(0);
      };
    }, [])
  );

  useEffect(() => {
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

    const listenerId = gradientAnimation.addListener(({ value }) => {
      if (value <= 0.5) {
        const progress = value * 2;
        setBorderColor(`rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, ${0.6 + progress * 0.4})`);
      } else {
        const progress = (value - 0.5) * 2;
        setBorderColor(`rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, ${1 - progress * 0.4})`);
      }
    });

    return () => {
      gradientAnimation.removeListener(listenerId);
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

      console.log('Signup successful, user:', data.user?.id);

      // Signup successful → user is authenticated
      // AppNavigator's auth state change listener will detect
      // the new session and navigate to onboarding automatically
      // Do NOT create profile here - that happens in onboarding
      setLoading(false);
    } catch (err: any) {
      console.error('Signup error:', err);
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
        <AnimatedCircle top="25%" left="50%" size={300} delay={0} />
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

