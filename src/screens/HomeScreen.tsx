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
  const [totalDates, setTotalDates] = useState<number>(0);

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

      const fetchTotalDates = async () => {
        try {
          const { count, error } = await supabase
            .from('dates')
            .select('*', { count: 'exact', head: true });

          if (error) throw error;
          setTotalDates(count || 0);
        } catch (error) {
          console.error('Error fetching total dates:', error);
        }
      };

      fetchRecentDates();
      fetchTotalDates();
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
      <View style={styles.content}>
        <Text style={styles.title}>Lolo</Text>
        {!loading && dates.length > 0 && (
          <Text style={styles.dateCount}>{totalDates} {totalDates === 1 ? 'date' : 'dates'}</Text>
        )}

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#666" />
        ) : dates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyText}>Your reflections will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={dates}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dateEntry}
                onPress={() => navigation.navigate('LogDate', { dateId: item.id })}
                activeOpacity={0.6}
              >
                <Text style={styles.feelingEmoji}>{getFeelingEmoji(item.feeling)}</Text>
                <View style={styles.feelingContent}>
                  <Text style={styles.feelingText}>
                    {item.feeling.charAt(0).toUpperCase() + item.feeling.slice(1)}
                    {item.emoji && <Text style={styles.customEmoji}> {item.emoji}</Text>}
                  </Text>
                  <Text style={styles.metaText}>{getRelativeTime(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  dateCount: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 36,
    fontWeight: '400',
  },
  loader: {
    marginTop: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '400',
  },
  listContent: {
    paddingBottom: 40,
  },
  dateEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  feelingEmoji: {
    fontSize: 48,
    marginRight: 20,
  },
  feelingContent: {
    flex: 1,
  },
  feelingText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  customEmoji: {
    fontSize: 24,
  },
  metaText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
  signOutButton: {
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signOutText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '400',
  },
});
