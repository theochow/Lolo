import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
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
  const [dropdownVisible, setDropdownVisible] = useState(false);

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

  const selectedPerson = people.find(p => p.id === selectedPersonId);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setDropdownVisible(!dropdownVisible)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownButtonContent}>
          {selectedPerson ? (
            <>
              <View style={styles.optionAvatar}>
                <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#666' }}>
                  <Text style={styles.optionAvatarText}>
                    {getInitials(selectedPerson.name)}
                  </Text>
                </View>
              </View>
              <Text style={styles.dropdownButtonText}>{selectedPerson.name}</Text>
            </>
          ) : (
            <Text style={styles.dropdownButtonText}>Today's Co-Star</Text>
          )}
        </View>
        <Text style={styles.dropdownArrow}>{dropdownVisible ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={[
            styles.modalOverlay,
            people.length === 0 && { justifyContent: 'flex-start', paddingTop: 100 }
          ]}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={[
            styles.dropdownList,
            people.length === 0 && { width: '100%', alignSelf: 'stretch', marginTop: 0, marginBottom: 'auto' }
          ]}>
            <ScrollView style={styles.dropdownScrollView}>
              {people.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  style={[
                    styles.dropdownItem,
                    selectedPersonId === person.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    onSelectPerson(person.id);
                    setDropdownVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionAvatar}>
                    <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#666' }}>
                      <Text style={styles.optionAvatarText}>
                        {getInitials(person.name)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedPersonId === person.id && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {person.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDropdownVisible(false);
                  navigation.navigate('AddPerson');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.createButtonText}>+ New Person</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
  },
  dropdownScrollView: {
    maxHeight: 500,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  dropdownItemSelected: {
    backgroundColor: '#F5F8FF',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  dropdownItemTextSelected: {
    color: '#666',
    fontWeight: '600',
  },
  optionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});
