import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabaseClient';
import { RootStackParamList } from '../../types/navigation';

type PrimaryIntentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrimaryIntents'>;
type PrimaryIntentsScreenRouteProp = RouteProp<RootStackParamList, 'PrimaryIntents'>;

const INTENT_OPTIONS = [
  { label: 'Reflect on dates', value: 'reflect_on_dates' },
  { label: 'Spot patterns', value: 'spot_patterns' },
  { label: 'Gain clarity', value: 'gain_clarity' },
  { label: 'Communicate better', value: 'communicate_better' },
  { label: 'Heal or reset', value: 'heal_or_reset' },
];

const MAX_SELECTIONS = 3;

export default function PrimaryIntentsScreen() {
  const navigation = useNavigation<PrimaryIntentsScreenNavigationProp>();
  const route = useRoute<PrimaryIntentsScreenRouteProp>();
  const { displayName, relationshipStatus } = route.params || {};
  const [selectedIntents, setSelectedIntents] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What do you want Lolo to help you with?</Text>
      <Text style={styles.subtitle}>Select up to {MAX_SELECTIONS}</Text>

      <View style={styles.optionsContainer}>
        {INTENT_OPTIONS.map((option) => {
          const isSelected = selectedIntents.includes(option.value);
          const isDisabled = !isSelected && selectedIntents.length >= MAX_SELECTIONS;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                isDisabled && styles.optionButtonDisabled,
              ]}
              onPress={() => toggleIntent(option.value)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                  isDisabled && styles.optionTextDisabled,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.completeButton, loading && styles.completeButtonDisabled]}
        onPress={handleComplete}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Complete</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
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
  optionButton: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#666',
    borderColor: '#666',
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  optionTextSelected: {
    color: '#fff',
  },
  optionTextDisabled: {
    color: '#999',
  },
  completeButton: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#999',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});

