import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import AnimatedCircle from '../../components/AnimatedCircle';

type RelationshipStatusScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RelationshipStatus'>;
type RelationshipStatusScreenRouteProp = RouteProp<RootStackParamList, 'RelationshipStatus'>;

const RELATIONSHIP_OPTIONS = [
  { label: 'Single & Dating', value: 'single_dating' },
  { label: 'In a Relationship', value: 'in_relationship' },
  { label: 'Long Term', value: 'long_term' },
  { label: 'Married', value: 'married' },
  { label: 'Figuring it Out', value: 'figuring_it_out' },
];

export default function RelationshipStatusScreen() {
  const navigation = useNavigation<RelationshipStatusScreenNavigationProp>();
  const route = useRoute<RelationshipStatusScreenRouteProp>();
  const { displayName } = route.params || {};
  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(null);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState('rgba(200, 180, 255, 0.6)');
  const [optionGradientColors, setOptionGradientColors] = useState<[string, string]>(['rgba(200, 180, 255, 0.8)', 'rgba(255, 200, 180, 0.8)']);

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

  const handleContinue = () => {
    navigation.navigate('PrimaryIntents', {
      displayName,
      relationshipStatus: selectedStatus,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        <AnimatedCircle top="40%" left="80%" size={260} delay={400} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: contentOpacity }}>
          <Text style={styles.title}>What's your relationship status?</Text>

      <View style={styles.optionsContainer}>
        {RELATIONSHIP_OPTIONS.map((option) => {
          const isSelected = selectedStatus === option.value;
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
                      onPress={() => setSelectedStatus(option.value)}
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
                  style={styles.optionButtonBlur}
                >
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => setSelectedStatus(option.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>
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
          styles.continueButtonContainer,
          {
            borderColor: borderColor,
            opacity: borderOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
    paddingTop: 60,
    zIndex: 1,
    position: 'relative',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 48,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
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
  continueButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  continueButton: {
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

