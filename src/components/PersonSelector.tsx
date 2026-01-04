import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import { RootStackParamList } from '../types/navigation';

interface Person {
  id: string;
  name: string;
}

interface PersonSelectorProps {
  selectedPersonId: string | null;
  onSelectPerson: (personId: string) => void;
}

export default function PersonSelector({
  selectedPersonId,
  onSelectPerson,
}: PersonSelectorProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('people')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setPeople(data || []);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tag to person</Text>
      <View style={styles.options}>
        {people.map((person) => (
          <TouchableOpacity
            key={person.id}
            style={[
              styles.option,
              selectedPersonId === person.id && styles.optionSelected,
            ]}
            onPress={() => onSelectPerson(person.id)}
          >
            <View style={styles.personOption}>
              <View style={styles.optionAvatar}>
                <Text style={styles.optionAvatarText}>
                  {getInitials(person.name)}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  selectedPersonId === person.id && styles.optionTextSelected,
                ]}
              >
                {person.name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('AddPerson')}
        >
          <Text style={styles.createButtonText}>+ Create new person</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  personOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#34C759',
    backgroundColor: 'transparent',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
  },
});
