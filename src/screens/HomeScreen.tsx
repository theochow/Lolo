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
import { HomeScreenProps } from '../types/navigation';

interface DateEntry {
  id: string;
  feeling: string;
  emoji: string | null;
  created_at: string;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchRecentDates = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('dates')
            .select('id, feeling, emoji, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;

          setDates(data || []);
        } catch (error) {
          console.error('Error fetching dates:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchRecentDates();
    }, [])
  );

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFeelingEmoji = (feeling: string) => {
    const emojiMap: Record<string, string> = {
      great: '😊',
      good: '🙂',
      meh: '😐',
      bad: '😕',
      awful: '😞',
    };
    return emojiMap[feeling] || '📅';
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return formatDate(dateString);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lolo</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent dates</Text>
        {loading ? (
          <ActivityIndicator style={styles.loader} color="#5B8DEF" />
        ) : dates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyText}>No dates logged yet</Text>
            <Text style={styles.emptySubtext}>Start reflecting on your dating journey</Text>
          </View>
        ) : (
          <FlatList
            data={dates}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dateCard}
                onPress={() => navigation.navigate('LogDate', { dateId: item.id })}
                activeOpacity={0.7}
              >
                <View style={styles.dateCardContent}>
                  <View style={styles.dateCardLeft}>
                    <Text style={styles.dateEmoji}>{getFeelingEmoji(item.feeling)}</Text>
                    <View style={styles.dateCardText}>
                      <Text style={styles.dateFeeling}>
                        {item.feeling.charAt(0).toUpperCase() + item.feeling.slice(1)}
                      </Text>
                      {item.emoji && <Text style={styles.dateCustomEmoji}> {item.emoji}</Text>}
                    </View>
                  </View>
                  <Text style={styles.dateTime}>{getRelativeTime(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  buttonContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#5B8DEF',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
    fontSize: 15,
  },
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  dateCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  dateCardText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateFeeling: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dateCustomEmoji: {
    fontSize: 20,
    marginLeft: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});
