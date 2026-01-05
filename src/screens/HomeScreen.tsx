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
import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Lolo</Text>
          </View>
          <View style={styles.profileIconContainer}>
            <TouchableOpacity
              style={styles.profileIcon}
              onPress={() => (navigation as any).navigate('EditProfile')}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
        {!loading && dates.length > 0 && (
          <Text style={styles.dateCount}>{totalDates} {totalDates === 1 ? 'date' : 'dates'}</Text>
        )}

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#666" />
        ) : dates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No reflections yet</Text>
            <Text style={styles.emptyText}>Your reflections will appear here</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => (navigation as any).navigate('LogDate')}
              activeOpacity={0.8}
            >
              <View style={styles.emptyButtonGradient}>
                <Text style={styles.emptyButtonText}>Log your first date</Text>
              </View>
            </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 0,
    position: 'relative',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  profileIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'absolute',
    right: 0,
  },
  profileIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#333',
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
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
});
