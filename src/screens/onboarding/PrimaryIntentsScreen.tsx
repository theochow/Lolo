import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabaseClient';
import { RootStackParamList } from '../../types/navigation';
import AnimatedCircle from '../../components/AnimatedCircle';
import { INTENT_OPTIONS, MAX_SELECTIONS } from '../../constants/onboarding';

type PrimaryIntentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrimaryIntents'>;
type PrimaryIntentsScreenRouteProp = RouteProp<RootStackParamList, 'PrimaryIntents'>;

export default function PrimaryIntentsScreen() {
  const navigation = useNavigation<PrimaryIntentsScreenNavigationProp>();
  const route = useRoute<PrimaryIntentsScreenRouteProp>();
  const { displayName, relationshipStatus } = route.params || {};
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState('rgba(200, 180, 255, 0.6)');
  const [optionGradientColors, setOptionGradientColors] = useState<[string, string]>(['rgba(200, 180, 255, 0.8)', 'rgba(255, 200, 180, 0.8)']);

  useFocusEffect(
    useCallback(() => {
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
        const color1 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.8)`;
        const color2 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.8)`;
        setBorderColor(`rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, ${0.6 + progress * 0.4})`);
        setOptionGradientColors([color1, color2]);
      } else {
        const progress = (value - 0.5) * 2;
        const color1 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.8)`;
        const color2 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.8)`;
        setBorderColor(`rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, ${1 - progress * 0.4})`);
        setOptionGradientColors([color1, color2]);
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

  const toggleIntent = (value: string) => {
    setSelectedIntents((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      } else if (prev.length < MAX_SELECTIONS) {
        return [...prev, value];
      }
      return prev;
    });
  };

  // Ref to prevent duplicate writes (idempotency)
  const isCompletingRef = useRef(false);

  const handleComplete = () => {
    // Prevent duplicate taps
    if (isCompletingRef.current) {
      if (__DEV__) {
        console.log('Onboarding completion already in progress, ignoring duplicate tap');
      }
      return;
    }

    // Set loading state immediately for visual feedback
    setError(null);
    setLoading(true);
    isCompletingRef.current = true;

    // Capture all data synchronously - these are from props/state, no async needed
    const capturedDisplayName = displayName && typeof displayName === 'string' && displayName.trim() !== '' 
      ? displayName.trim() 
      : null;
    const capturedRelationshipStatus = relationshipStatus && typeof relationshipStatus === 'string' && relationshipStatus.trim() !== '' 
      ? relationshipStatus.trim() 
      : null;
    const capturedPrimaryIntents = Array.isArray(selectedIntents) && selectedIntents.length > 0 
      ? selectedIntents 
      : null;

    // Fire-and-forget: Save to Supabase in background
    // This does NOT block navigation - navigation happens immediately below
    (async () => {
      try {
        // Get session (async, but doesn't block)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user?.id) {
          if (__DEV__) {
            console.error('Background save: Session error:', sessionError || 'No session');
          }
          // Don't throw - user is already navigated, error is logged
          isCompletingRef.current = false;
          return;
        }

        const userId = session.user.id;

        // Prepare onboarding data
        const onboardingData = {
          id: userId,
          display_name: capturedDisplayName,
          relationship_status: capturedRelationshipStatus,
          primary_intents: capturedPrimaryIntents,
        };

        // Upsert profile (fire-and-forget)
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(onboardingData, {
            onConflict: 'id',
          });

        if (upsertError) {
          // Log error but don't crash - user is already navigated
          if (__DEV__) {
            console.error('Background profile save error:', {
              error: upsertError,
              code: upsertError.code,
              message: upsertError.message,
              userId,
            });
          }
          // AppNavigator's periodic check will retry detection
        } else {
          if (__DEV__) {
            console.log('Background profile save successful:', {
              userId,
              display_name: capturedDisplayName,
              relationship_status: capturedRelationshipStatus,
              primary_intents: capturedPrimaryIntents,
            });
          }
        }
      } catch (backgroundError: any) {
        // Catch-all for any unexpected errors in background save
        if (__DEV__) {
          console.error('Unexpected error in background profile save:', backgroundError);
        }
        // Don't throw - user is already navigated, error is logged
      } finally {
        // Reset ref after completion (allows retry if needed)
        isCompletingRef.current = false;
      }
    })();

    // NAVIGATION HAPPENS IMMEDIATELY - no await
    // Reset loading state immediately so UI doesn't freeze
    setLoading(false);
    
    // AppNavigator's periodic check (runs every 100ms) will detect the saved profile
    // within 100-500ms and automatically navigate to MainTabs
    // The rapid checks at 200ms, 400ms, etc. ensure fast detection
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <View style={styles.gradientContainer}>
        <AnimatedCircle top={0} left="50%" size={600} delay={600} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: contentOpacity }}>
          <Text style={styles.title}>What do you want Lolo to help you with?</Text>
          <Text style={styles.subtitle}>Select up to {MAX_SELECTIONS}</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

      <View style={styles.optionsContainer}>
        {INTENT_OPTIONS.map((option) => {
          const isSelected = selectedIntents.includes(option.value);
          const isDisabled = !isSelected && selectedIntents.length >= MAX_SELECTIONS;
          return (
            <View key={option.value} style={styles.optionButtonContainer}>
              {isSelected ? (
                <View style={styles.optionButtonGradientContainer}>
                  <LinearGradient
                    colors={optionGradientColors}
                    style={styles.optionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => toggleIntent(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionTextSelected}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                <BlurView 
                  intensity={30} 
                  tint="light" 
                  style={[
                    styles.optionButtonBlur,
                    isDisabled && styles.optionButtonBlurDisabled,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => toggleIntent(option.value)}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isDisabled && styles.optionTextDisabled,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                </BlurView>
              )}
            </View>
          );
        })}
      </View>

      <Animated.View
        style={[
          styles.completeButtonContainer,
          {
            borderColor: borderColor,
            opacity: borderOpacity,
          },
          loading && styles.completeButtonContainerDisabled,
        ]}
      >
        <TouchableOpacity
          style={[styles.completeButton, loading && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text style={styles.buttonText}>Complete</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 24,
    zIndex: 1,
    position: 'relative',
    minHeight: '100%',
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionButtonBlur: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionButtonBlurDisabled: {
    opacity: 0.5,
  },
  optionButtonGradientContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionButtonGradient: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButton: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: '100%',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  optionTextSelected: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  optionTextDisabled: {
    color: '#999',
  },
  completeButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  completeButtonContainerDisabled: {
    opacity: 0.6,
  },
  completeButton: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  completeButtonDisabled: {
    opacity: 1,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});
