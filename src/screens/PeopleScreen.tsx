import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { PeopleScreenProps } from '../types/navigation';

interface Person {
  id: string;
  name: string;
  created_at: string;
  date_count?: number;
  latest_feeling?: string;
}

export default function PeopleScreen({ navigation }: PeopleScreenProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchPeople = async () => {
        setLoading(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) return;

          // Fetch people
          const { data: peopleData, error: peopleError } = await supabase
            .from('people')
            .select('id, name, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (peopleError) throw peopleError;

          // Fetch dates for each person to get counts and latest feeling
          const peopleWithStats = await Promise.all(
            (peopleData || []).map(async (person) => {
              const { data: datesData } = await supabase
                .from('dates')
                .select('feeling, created_at')
                .eq('person_id', person.id)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

              return {
                id: person.id,
                name: person.name,
                created_at: person.created_at,
                date_count: datesData?.length || 0,
                latest_feeling: datesData?.[0]?.feeling,
              };
            })
          );

          setPeople(peopleWithStats);
        } catch (error) {
          console.error('Error fetching people:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPeople();
    }, [])
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFeelingEmoji = (feeling?: string) => {
    const emojiMap: Record<string, string> = {
      great: '😊',
      good: '🙂',
      meh: '😐',
      bad: '😕',
      awful: '😞',
    };
    return feeling ? emojiMap[feeling] || '📅' : '📅';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            (navigation as any).navigate('AddPerson');
          }}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : people.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👋</Text>
          <Text style={styles.emptyTitle}>No people yet</Text>
          <Text style={styles.emptyText}>
            Start logging dates to build your reflection journal
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => (navigation as any).navigate('AddPerson')}
          >
            <Text style={styles.emptyButtonText}>Add your first person</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.personCard}
              onPress={() => (navigation as any).navigate('PersonProfile', { personId: item.id })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{item.name}</Text>
                <Text style={styles.personMeta}>
                  {item.date_count || 0} {item.date_count === 1 ? 'date' : 'dates'}
                  {item.latest_feeling && ` · ${getFeelingEmoji(item.latest_feeling)}`}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 20,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  personMeta: {
    fontSize: 14,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
