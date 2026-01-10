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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabaseClient';
import { RootStackParamList } from '../../types/navigation';
import AnimatedCircle from '../../components/AnimatedCircle';

type PrimaryIntentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrimaryIntents'>;
type PrimaryIntentsScreenRouteProp = RouteProp<RootStackParamList, 'PrimaryIntents'>;

const INTENT_OPTIONS = [
  { label: 'Reflect on dates', value: 'reflect_on_dates' },
  { label: 'Spot patterns', value: 'spot_patterns' },
  { label: 'Gain clarity', value: 'gain_clarity' },
  { label: 'Communicate better', value: 'communicate_better' },
  { label: 'Heal or reset', value: 'heal_or_reset' },
];

const MAX_SELECTIONS = 2;

export default function PrimaryIntentsScreen() {
  const navigation = useNavigation<PrimaryIntentsScreenNavigationProp>();
  const route = useRoute<PrimaryIntentsScreenRouteProp>();
  const { displayName, relationshipStatus } = route.params || {};
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleComplete = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upsert profile with all onboarding data
      // All fields are optional - user can skip any step
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName && displayName.trim() !== '' ? displayName.trim() : null,
          relationship_status: relationshipStatus && relationshipStatus.trim() !== '' ? relationshipStatus : null,
          primary_intents: selectedIntents.length > 0 ? selectedIntents : null,
        }, {
          onConflict: 'id',
        });

      if (error) throw error;

      // Onboarding complete - AppNavigator will detect completion via periodic check
      // The check happens every 300ms, so navigation should happen quickly
      setLoading(false);
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      setLoading(false);
    }
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
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    zIndex: 1,
    position: 'relative',
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

