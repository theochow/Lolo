import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { AddPersonScreenProps } from '../types/navigation';

export default function AddPersonScreen({ navigation }: AddPersonScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [howMet, setHowMet] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // Scroll to ensure inputs are visible
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShow.remove();
    };
  }, []);

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
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.formContent}>
        <Text style={styles.title}>Add Person</Text>
        <TextInput
          ref={(ref) => (inputRefs.current.name = ref)}
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="rgba(26, 26, 26, 0.3)"
          value={name}
          onChangeText={setName}
          onFocus={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}
          autoFocus
        />

        <TextInput
          ref={(ref) => (inputRefs.current.age = ref)}
          style={styles.input}
          placeholder="Age"
          placeholderTextColor="rgba(26, 26, 26, 0.3)"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          onFocus={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}
        />

        <TextInput
          ref={(ref) => (inputRefs.current.profession = ref)}
          style={styles.input}
          placeholder="Profession"
          placeholderTextColor="rgba(26, 26, 26, 0.3)"
          value={profession}
          onChangeText={setProfession}
          onFocus={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}
        />

        <TextInput
          ref={(ref) => (inputRefs.current.howMet = ref)}
          style={[styles.input, styles.multilineInput]}
          placeholder="How you met"
          placeholderTextColor="rgba(26, 26, 26, 0.3)"
          value={howMet}
          onChangeText={setHowMet}
          multiline
          numberOfLines={3}
          onFocus={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !name.trim()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 60,
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
  formContent: {
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
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
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#999',
    marginTop: 8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

