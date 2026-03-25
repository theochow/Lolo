import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Animated,
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
  const [displayName, setDisplayName] = useState<string | null>(null);
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState('rgba(200, 180, 255, 0.6)');

  useEffect(() => {
    const gradientColorAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );

    const borderAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(borderPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    gradientColorAnimation.start();
    borderAnimation.start();

    const listenerId = gradientAnimation.addListener(({ value }) => {
      if (value <= 0.5) {
        const progress = value * 2;
        setBorderColor(`rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, ${0.6 + progress * 0.4})`);
      } else {
        const progress = (value - 0.5) * 2;
        setBorderColor(`rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, ${1 - progress * 0.4})`);
      }
    });

    return () => {
      gradientAnimation.removeListener(listenerId);
    };
  }, []);

  const borderOpacity = borderPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

      useFocusEffect(
    React.useCallback(() => {
      const fetchPeople = async () => {
        setLoading(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            setLoading(false);
            return;
          }

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
              // Get count of all dates
              const { count } = await supabase
                .from('dates')
                .select('*', { count: 'exact', head: true })
                .eq('person_id', person.id)
                .eq('user_id', user.id);

              // Get latest feeling
              const { data: latestDate } = await supabase
                .from('dates')
                .select('feeling')
                .eq('person_id', person.id)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              return {
                id: person.id,
                name: person.name,
                created_at: person.created_at,
                date_count: count || 0,
                latest_feeling: latestDate?.feeling,
              };
            })
          );

          setPeople(peopleWithStats);
        } catch (error) {
          // CRASH FIX: Guard console.error with __DEV__
          if (__DEV__) {
            console.error('Error fetching people:', error);
          }
          // In production, silently fail - empty state will show
        } finally {
          setLoading(false);
        }
      };

      const fetchDisplayName = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) return;

          const { data, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            if (__DEV__) {
              console.error('Error fetching display name:', error);
            }
            return;
          }

          if (data?.display_name) {
            setDisplayName(data.display_name);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error fetching display name:', error);
          }
        }
      };

      fetchPeople();
      fetchDisplayName();
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Roster</Text>
        {displayName && (
          <Text style={styles.greeting}>
            {getGreeting()}, {displayName}
          </Text>
        )}
        {people.length > 0 && (
          <Animated.View
            style={[
              styles.addButtonContainer,
              {
                borderColor: borderColor,
                opacity: borderOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                (navigation as any).navigate('AddPerson');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Add person</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
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
          <Animated.View
            style={[
              styles.emptyButtonContainer,
              {
                borderColor: borderColor,
                opacity: borderOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => (navigation as any).navigate('AddPerson')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Add your first person</Text>
            </TouchableOpacity>
          </Animated.View>
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
                <View style={styles.avatarGradient}>
                  <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                </View>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 20,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  addButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  addButton: {
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  addButtonText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
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
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#666',
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
    color: '#666',
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  emptyButton: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  emptyButtonText: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});
