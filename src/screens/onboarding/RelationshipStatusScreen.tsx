import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

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

  const handleContinue = () => {
    navigation.navigate('PrimaryIntents', {
      displayName,
      relationshipStatus: selectedStatus,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>What's your relationship status?</Text>

      <View style={styles.optionsContainer}>
        {RELATIONSHIP_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selectedStatus === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => setSelectedStatus(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                selectedStatus === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
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
    marginBottom: 48,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
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
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  optionTextSelected: {
    color: '#fff',
  },
  continueButton: {
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
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});

