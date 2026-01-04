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
      <Text style={styles.label}>Tonight's co-star</Text>
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  optionSelected: {
    borderColor: '#5B8DEF',
    backgroundColor: 'rgba(255, 107, 157, 0.8)',
    shadowColor: '#5B8DEF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  personOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionAvatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
  createButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34C759',
  },
});
