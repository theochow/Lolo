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
      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Profession</Text>
        <TextInput
          style={styles.input}
          placeholder="Profession"
          value={profession}
          onChangeText={setProfession}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>How you met</Text>
        <TextInput
          style={styles.input}
          placeholder="How you met"
          value={howMet}
          onChangeText={setHowMet}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !name.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Add Person</Text>
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
    padding: 24,
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 52,
    color: '#1A1A1A',
  },
  submitButton: {
    backgroundColor: '#5B8DEF',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

