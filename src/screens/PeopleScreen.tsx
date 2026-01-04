import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
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
        <Text style={styles.title}>Roster</Text>
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
              activeOpacity={0.7}
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
    backgroundColor: '#FAFAFA',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    position: 'relative',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    backgroundColor: '#5B8DEF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1A1A1A',
  },
  personMeta: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#CCC',
    fontWeight: '300',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#5B8DEF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
