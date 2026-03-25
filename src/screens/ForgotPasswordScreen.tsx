import React, { useState, useRef, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import { RootStackParamList } from '../types/navigation';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState('rgba(200, 180, 255, 0.6)');
  const [gradientColors, setGradientColors] = useState<[string, string]>(['rgba(200, 180, 255, 0.6)', 'rgba(255, 200, 180, 0.5)']);

  const screenDimensions = useRef<{ height: number; width: number } | null>(null);
  if (!screenDimensions.current) {
    const { Dimensions } = require('react-native');
    screenDimensions.current = Dimensions.get('window');
  }

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
    let listenerId: string | undefined;
    let animationFrameId: number;

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
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (listenerId !== undefined) gradientAnimation.removeListener(listenerId);
    };
  }, []);

  const borderOpacity = borderPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const handleSend = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    const sanitizedEmail = String(email).trim().toLowerCase();

    const redirectTo = Platform.OS === 'web'
      ? `${window.location.origin}/`
      : 'lolo://reset-password';

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <View style={styles.gradientContainer}>
        <View style={styles.gradientCircle}>
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
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          {sent ? (
            <View style={styles.sentContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={36} color="#1A1A1A" />
              </View>
              <Text style={styles.sentTitle}>Check your inbox</Text>
              <Text style={styles.sentSubtitle}>
                We sent a password reset link to{'\n'}
                <Text style={styles.sentEmail}>{email.trim().toLowerCase()}</Text>
              </Text>
              <TouchableOpacity
                style={styles.backToSignInButton}
                onPress={() => navigation.navigate('Auth')}
                activeOpacity={0.7}
              >
                <Text style={styles.backToSignInText}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a reset link.
              </Text>

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
                      autoFocus
                    />
                  </BlurView>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Animated.View
                  style={[
                    styles.sendButtonContainer,
                    {
                      borderColor: borderColor,
                      opacity: borderOpacity,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSend}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#1A1A1A" />
                    ) : (
                      <Text style={styles.buttonText}>Send reset link</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </>
          )}
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
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
    top: '15%',
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
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
    position: 'relative',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    lineHeight: 22,
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
  sendButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sendButton: {
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
  // Sent confirmation state
  sentContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(200, 180, 255, 0.4)',
  },
  sentTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
    marginBottom: 12,
  },
  sentSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    lineHeight: 22,
    marginBottom: 40,
  },
  sentEmail: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  backToSignInButton: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToSignInText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});
