import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { DateDetailsScreenProps } from '../types/navigation';

interface DateDetails {
  id: string;
  feeling: string;
  emoji: string | null;
  activity: string | null;
  location: string | null;
  rating: number | null;
  green_flag: string | null;
  red_flag: string | null;
  created_at: string;
  person_id: string | null;
  person?: {
    name: string;
  };
}

const FEELINGS = [
  { label: 'Great', value: 'great', emoji: '😊' },
  { label: 'Good', value: 'good', emoji: '🙂' },
  { label: 'Meh', value: 'meh', emoji: '😐' },
  { label: 'Bad', value: 'bad', emoji: '😕' },
  { label: 'Awful', value: 'awful', emoji: '😞' },
];

export default function DateDetailsScreen({
  navigation,
  route,
}: DateDetailsScreenProps) {
  // CRASH FIX: Guard against null route.params
  const { dateId } = route.params || {};
  const [dateDetails, setDateDetails] = useState<DateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      // CRASH FIX: Only fetch if dateId exists
      if (dateId) {
        fetchDateDetails();
      } else {
        setError('Date ID is missing');
        setLoading(false);
      }
    }, [dateId])
  );

  const fetchDateDetails = async () => {
    // CRASH FIX: Guard against missing dateId
    if (!dateId || typeof dateId !== 'string') {
      setError('Invalid date ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // CRASH FIX: Handle auth errors
      if (userError || !user) {
        setError('Authentication failed. Please sign in again.');
        setLoading(false);
        return;
      }

      // First fetch the date
      const { data: dateData, error: dateError } = await supabase
        .from('dates')
        .select('*')
        .eq('id', dateId)
        .eq('user_id', user.id)
        .single();

      // CRASH FIX: Handle Supabase errors explicitly
      if (dateError) {
        if (__DEV__) {
          console.error('Error fetching date:', dateError);
        }
        setError('Failed to load date details. Please try again.');
        setDateDetails(null);
        setLoading(false);
        return;
      }

      // CRASH FIX: Guard against null dateData
      if (!dateData) {
        setError('Date not found');
        setLoading(false);
        return;
      }

      // If person_id exists, fetch person name
      if (dateData.person_id) {
        try {
          const { data: personData, error: personError } = await supabase
            .from('people')
            .select('name')
            .eq('id', dateData.person_id)
            .eq('user_id', user.id)
            .single();

          // CRASH FIX: Handle person fetch errors gracefully
          setDateDetails({
            ...dateData,
            person: personData && !personError ? { name: personData.name } : undefined,
          } as DateDetails);
        } catch (personErr) {
          // If person fetch fails, still show date without person info
          if (__DEV__) {
            console.error('Error fetching person:', personErr);
          }
          setDateDetails(dateData as DateDetails);
        }
      } else {
        setDateDetails(dateData as DateDetails);
      }
    } catch (error: any) {
      // CRASH FIX: Comprehensive error handling
      if (__DEV__) {
        console.error('Unexpected error fetching date details:', error);
      }
      setError(error?.message || 'An unexpected error occurred');
      setDateDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const getFeelingData = (feeling: string) => {
    return FEELINGS.find((f) => f.value === feeling) || FEELINGS[2];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} />
      </View>
    );
  }

  // CRASH FIX: Show error state if fetch failed
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // CRASH FIX: Guard against null dateDetails
  if (!dateDetails) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>Date not found</Text>
        </View>
      </View>
    );
  }

  const feelingData = getFeelingData(dateDetails.feeling);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Feeling */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Feeling</Text>
          <View style={styles.feelingRow}>
            <Text style={styles.feelingEmoji}>{feelingData.emoji}</Text>
            <Text style={styles.feelingLabel}>{feelingData.label}</Text>
            {dateDetails.emoji && (
              <Text style={[styles.customEmoji, { marginLeft: 12 }]}>
                {dateDetails.emoji}
              </Text>
            )}
          </View>
        </View>

        {/* Rating */}
        {dateDetails.rating && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Rating</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  style={[
                    styles.star,
                    star <= dateDetails.rating! && styles.starFilled,
                    { marginHorizontal: 2 },
                  ]}
                >
                  ★
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Activity */}
        {dateDetails.activity && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Activity</Text>
            <Text style={styles.sectionValue}>{dateDetails.activity}</Text>
          </View>
        )}

        {/* Location */}
        {dateDetails.location && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <Text style={styles.sectionValue}>{dateDetails.location}</Text>
          </View>
        )}

        {/* Person */}
        {dateDetails.person_id && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>With</Text>
            {dateDetails.person ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('PersonProfile', {
                    personId: dateDetails.person_id!,
                  })
                }
              >
                <Text style={styles.personLink}>{dateDetails.person.name}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.sectionValue}>Person (ID: {dateDetails.person_id})</Text>
            )}
          </View>
        )}

        {/* Green Flag */}
        {dateDetails.green_flag && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Green Flag</Text>
            <View style={styles.flagContainer}>
              <View style={styles.greenFlag}>
                <Text style={styles.flagText}>✓ {dateDetails.green_flag}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Red Flag */}
        {dateDetails.red_flag && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Red Flag</Text>
            <View style={styles.flagContainer}>
              <View style={styles.redFlag}>
                <Text style={styles.flagText}>✗ {dateDetails.red_flag}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <Text style={styles.sectionValue}>{formatDate(dateDetails.created_at)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    marginTop: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 18,
    color: '#333',
  },
  feelingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feelingEmoji: {
    fontSize: 48,
  },
  feelingLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  customEmoji: {
    fontSize: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    marginHorizontal: -2,
  },
  star: {
    fontSize: 28,
    color: '#ddd',
  },
  starFilled: {
    color: '#FFD700',
  },
  personLink: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '500',
  },
  flagContainer: {
    flexDirection: 'row',
  },
  greenFlag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  redFlag: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  flagText: {
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 20,
  },
});
