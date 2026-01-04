import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { AddPersonScreenProps } from '../types/navigation';

export default function AddPersonScreen({ navigation }: AddPersonScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [howMet, setHowMet] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Explicit mapping: UI state → database columns
      const personInsertData = {
        user_id: user.id,
        name: name.trim(),
        age: age.trim() ? parseInt(age, 10) || null : null,
        profession: profession.trim() || null,
        how_met: howMet.trim() || null,
      };

      const { data, error } = await supabase
        .from('people')
        .insert(personInsertData)
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Person added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add person');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formContent}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="rgba(26, 26, 26, 0.3)"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor="rgba(26, 26, 26, 0.3)"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Profession"
          placeholderTextColor="rgba(26, 26, 26, 0.3)"
          value={profession}
          onChangeText={setProfession}
        />

        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="How you met"
          placeholderTextColor="rgba(26, 26, 26, 0.3)"
          value={howMet}
          onChangeText={setHowMet}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !name.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  formContent: {
    gap: 16,
  },
  input: {
    borderRadius: 20,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    minHeight: 52,
    color: '#1A1A1A',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 18,
  },
  submitButton: {
    backgroundColor: '#5B8DEF',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

