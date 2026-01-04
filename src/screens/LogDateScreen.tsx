import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { LogDateScreenProps } from '../types/navigation';

const FEELINGS = [
  { label: 'Great', value: 'great' },
  { label: 'Good', value: 'good' },
  { label: 'Meh', value: 'meh' },
  { label: 'Bad', value: 'bad' },
  { label: 'Awful', value: 'awful' },
];

export default function LogDateScreen({ navigation }: LogDateScreenProps) {
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [emoji, setEmoji] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedFeeling) {
      setError('Please select a feeling');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Failed to get user. Please try again.');
      }

      const { error: insertError } = await supabase.from('dates').insert({
        user_id: user.id,
        feeling: selectedFeeling,
        emoji: emoji.trim() || null,
      });

      if (insertError) {
        throw insertError;
      }

      Alert.alert('Success', 'Date logged successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to log date. Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log a date</Text>

      <View style={styles.section}>
        <Text style={styles.label}>How are you feeling?</Text>
        <View style={styles.feelingGrid}>
          {FEELINGS.map((feeling) => (
            <TouchableOpacity
              key={feeling.value}
              style={[
                styles.feelingButton,
                selectedFeeling === feeling.value && styles.feelingButtonSelected,
              ]}
              onPress={() => {
                setSelectedFeeling(feeling.value);
                setError('');
              }}
            >
              <Text
                style={[
                  styles.feelingButtonText,
                  selectedFeeling === feeling.value && styles.feelingButtonTextSelected,
                ]}
              >
                {feeling.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Emoji (optional)</Text>
        <TextInput
          style={styles.emojiInput}
          placeholder="😊"
          value={emoji}
          onChangeText={setEmoji}
          maxLength={2}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  feelingButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    margin: 6,
  },
  feelingButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  feelingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feelingButtonTextSelected: {
    color: '#fff',
  },
  emojiInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
