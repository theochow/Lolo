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
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import { RootStackParamList } from '../types/navigation';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

const RELATIONSHIP_OPTIONS = [
  { label: 'Single & Dating', value: 'single_dating' },
  { label: 'In a Relationship', value: 'in_relationship' },
  { label: 'Long Term', value: 'long_term' },
  { label: 'Married', value: 'married' },
  { label: 'Figuring it Out', value: 'figuring_it_out' },
];

const INTENT_OPTIONS = [
  { label: 'Reflect on dates', value: 'reflect_on_dates' },
  { label: 'Spot patterns', value: 'spot_patterns' },
  { label: 'Gain clarity', value: 'gain_clarity' },
  { label: 'Communicate better', value: 'communicate_better' },
  { label: 'Heal or reset', value: 'heal_or_reset' },
];

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const [displayName, setDisplayName] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState<string | null>(null);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intentError, setIntentError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState('rgba(200, 180, 255, 0.6)');
  const [optionGradientColors, setOptionGradientColors] = useState<[string, string]>(['rgba(200, 180, 255, 0.8)', 'rgba(255, 200, 180, 0.8)']);

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, relationship_status, primary_intents')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setDisplayName(data.display_name || '');
        setRelationshipStatus(data.relationship_status || null);
        setSelectedIntents(Array.isArray(data.primary_intents) ? data.primary_intents : []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIntent = (value: string) => {
    setSelectedIntents((prev) => {
      if (prev.includes(value)) {
        setIntentError('');
        return prev.filter((v) => v !== value);
      } else if (prev.length < 2) {
        setIntentError('');
        return [...prev, value];
      } else {
        setIntentError('You can select up to 2 primary intents');
        return prev;
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

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

      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently remove all your data including dates, people, and profile information. Your data will no longer be recoverable. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                throw new Error('User not authenticated');
              }

              // Delete all user data from database
              // Delete dates
              const { error: datesError } = await supabase
                .from('dates')
                .delete()
                .eq('user_id', user.id);

              if (datesError) {
                console.error('Error deleting dates:', datesError);
                throw datesError;
              }

              // Delete people
              const { error: peopleError } = await supabase
                .from('people')
                .delete()
                .eq('user_id', user.id);

              if (peopleError) {
                console.error('Error deleting people:', peopleError);
                throw peopleError;
              }

              // Delete profile
              const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

              if (profileError) {
                console.error('Error deleting profile:', profileError);
                throw profileError;
              }

              // Sign out after deleting all data
              // Note: The auth user account itself requires admin privileges to delete
              // All user data (dates, people, profiles) has been removed
              await supabase.auth.signOut();
              
              Alert.alert(
                'Account Deleted',
                'All your data has been permanently deleted. You have been signed out.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                'There was an error deleting your account. Please try again or contact support.',
                [{ text: 'OK' }]
              );
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} color="#666" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Display Name</Text>
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

          <Text style={styles.sectionTitle}>Relationship Status</Text>
          <View style={styles.optionsContainer}>
            {RELATIONSHIP_OPTIONS.map((option) => {
              const isSelected = relationshipStatus === option.value;
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
                          onPress={() => setRelationshipStatus(option.value)}
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
                        onPress={() => setRelationshipStatus(option.value)}
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

          <Text style={styles.sectionTitle}>Primary Intents</Text>
          <Text style={styles.subtitle}>Select up to 2</Text>
          {intentError ? (
            <Text style={styles.errorText}>{intentError}</Text>
          ) : null}
          <View style={styles.optionsContainer}>
            {INTENT_OPTIONS.map((option) => {
              const isSelected = selectedIntents.includes(option.value);
              const isDisabled = !isSelected && selectedIntents.length >= 2;
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
              styles.saveButtonContainer,
              {
                borderColor: borderColor,
                opacity: borderOpacity,
              },
              saving && styles.saveButtonContainerDisabled,
            ]}
          >
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.privacyButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            activeOpacity={0.7}
          >
            <Text style={styles.privacyButtonText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteAccountButton, deleting && styles.deleteAccountButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleting}
            activeOpacity={0.7}
          >
            {deleting ? (
              <ActivityIndicator color="#FF6B6B" />
            ) : (
              <Text style={styles.deleteAccountText}>Delete account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
  },
  loader: {
    marginTop: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 16,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  inputContainer: {
    marginBottom: 24,
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
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
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
  saveButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginTop: 32,
    marginBottom: 12,
  },
  saveButtonContainerDisabled: {
    opacity: 0.6,
  },
  saveButton: {
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
  privacyButton: {
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  privacyButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
  signOutButton: {
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signOutText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
  deleteAccountButton: {
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteAccountButtonDisabled: {
    opacity: 0.6,
  },
  deleteAccountText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
});

