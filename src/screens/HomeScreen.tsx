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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lolo</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('LogDate')}
        >
          <Text style={styles.primaryButtonText}>Log a date</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent dates</Text>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : dates.length === 0 ? (
          <Text style={styles.emptyText}>No dates logged yet</Text>
        ) : (
          <FlatList
            data={dates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.dateItem}>
                <View style={styles.dateItemLeft}>
                  <Text style={styles.dateFeeling}>{item.feeling}</Text>
                  {item.emoji && <Text style={styles.dateEmoji}> {item.emoji}</Text>}
                </View>
                <Text style={styles.dateTime}>{formatDate(item.created_at)}</Text>
              </View>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateFeeling: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateEmoji: {
    fontSize: 20,
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
  },
});
