import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import AnimatedCircle from '../../components/AnimatedCircle';

type DisplayNameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DisplayName'>;

export default function DisplayNameScreen() {
  const navigation = useNavigation<DisplayNameScreenNavigationProp>();
  const [displayName, setDisplayName] = useState('');
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

  const handleContinue = () => {
    navigation.navigate('RelationshipStatus', { displayName: displayName.trim() || null });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.gradientContainer}>
        <AnimatedCircle top="35%" left="20%" size={280} delay={200} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          <Text style={styles.title}>What should we call you?</Text>

          <View style={styles.inputContainer}>
            <BlurView intensity={30} tint="light" style={styles.inputBlur}>
              <TextInput
                style={styles.input}
                placeholder="Display name"
                placeholderTextColor="rgba(0, 0, 0, 0.5)"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </BlurView>
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 48,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  inputContainer: {
    marginBottom: 32,
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

