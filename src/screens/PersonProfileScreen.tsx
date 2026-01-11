import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { PersonProfileScreenProps } from '../types/navigation';

interface Person {
  id: string;
  name: string;
  age?: number;
  profession?: string;
  industry?: string;
  how_met?: string;
  hometown?: string;
  hair_color?: string;
  eye_color?: string;
  height?: string;
  myers_briggs?: string;
  star_sign?: string;
  created_at: string;
}

interface DateEntry {
  id: string;
  feeling: string;
  emoji: string | null;
  activity: string | null;
  location: string | null;
  created_at: string;
}

const FEELINGS = [
  { label: 'Great', value: 'great', emoji: '😊' },
  { label: 'Good', value: 'good', emoji: '🙂' },
  { label: 'Meh', value: 'meh', emoji: '😐' },
  { label: 'Bad', value: 'bad', emoji: '😕' },
  { label: 'Awful', value: 'awful', emoji: '😞' },
];

export default function PersonProfileScreen({
  navigation,
  route,
}: PersonProfileScreenProps) {
  // CRASH FIX: Guard against null route.params
  const { personId } = route.params || {};
  const [person, setPerson] = useState<Person | null>(null);
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingAge, setEditingAge] = useState('');
  const [editingProfession, setEditingProfession] = useState('');
  const [editingHowMet, setEditingHowMet] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // CRASH FIX: Only fetch if personId exists
      if (personId) {
        fetchPersonAndDates();
      } else {
        setError('Person ID is missing');
        setLoading(false);
      }
    }, [personId])
  );

  const fetchPersonAndDates = async () => {
    // CRASH FIX: Guard against missing personId
    if (!personId || typeof personId !== 'string') {
      setError('Invalid person ID');
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

      // Fetch person
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .eq('user_id', user.id)
        .single();

      // CRASH FIX: Handle Supabase errors explicitly
      if (personError) {
        if (__DEV__) {
          console.error('Error fetching person:', personError);
        }
        setError('Failed to load person profile. Please try again.');
        setLoading(false);
        return;
      }

      // CRASH FIX: Guard against null personData
      if (!personData) {
        setError('Person not found');
        setLoading(false);
        return;
      }

      setPerson(personData);
      // Initialize edit fields with current values
      setEditingName(personData.name || '');
      setEditingAge(personData.age ? personData.age.toString() : '');
      setEditingProfession(personData.profession || '');
      setEditingHowMet(personData.how_met || '');

      // Fetch dates for this person
      const { data: datesData, error: datesError } = await supabase
        .from('dates')
        .select('id, feeling, emoji, activity, location, created_at')
        .eq('person_id', personId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // CRASH FIX: Handle dates fetch errors gracefully
      if (datesError) {
        if (__DEV__) {
          console.error('Error fetching dates:', datesError);
        }
        // Don't fail the whole screen if dates fail to load
        setDates([]);
      } else {
        setDates(datesData || []);
      }
    } catch (error: any) {
      // CRASH FIX: Comprehensive error handling
      if (__DEV__) {
        console.error('Unexpected error fetching person:', error);
      }
      setError(error?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };


  const getFeelingEmoji = (feeling: string) => {
    return FEELINGS.find((f) => f.value === feeling)?.emoji || '📅';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getEmotionalSnapshot = () => {
    const feelingCounts: Record<string, number> = {};
    dates.forEach((date) => {
      feelingCounts[date.feeling] = (feelingCounts[date.feeling] || 0) + 1;
    });

    const sorted = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSaveDetails = async () => {
    if (!editingName.trim() || !person) return;

    setSavingDetails(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Explicit mapping: UI state → database columns
      const updateData: {
        name: string;
        age: number | null;
        profession: string | null;
        how_met: string | null;
      } = {
        name: editingName.trim(),
        age: editingAge.trim() ? parseInt(editingAge, 10) || null : null,
        profession: editingProfession.trim() || null,
        how_met: editingHowMet.trim() || null,
      };

      // CRASH FIX: Guard against missing personId
      if (!personId || typeof personId !== 'string') {
        throw new Error('Invalid person ID');
      }

      const { data: updatedData, error } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', personId)
        .eq('user_id', user.id)
        .select()
        .single();

      // CRASH FIX: Handle Supabase errors explicitly
      if (error) {
        if (__DEV__) {
          console.error('Supabase update error:', error);
        }
        throw new Error(error.message || 'Failed to save details');
      }

      // CRASH FIX: Guard against null updatedData
      if (!updatedData) {
        throw new Error('Update succeeded but no data returned');
      }

      // Optimistically update local state
      if (updatedData) {
        setPerson(updatedData);
      }

      setShowEditDetails(false);
      // Refresh to ensure consistency
      fetchPersonAndDates();
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error saving details:', error);
      }
      Alert.alert('Error', error.message || 'Failed to save details');
    } finally {
      setSavingDetails(false);
    }
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // CRASH FIX: Guard against null person
  if (!person) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.errorText}>Person not found</Text>
        </View>
      </View>
    );
  }

  const dominantFeeling = getEmotionalSnapshot();
  const dominantFeelingData = dominantFeeling
    ? FEELINGS.find((f) => f.value === dominantFeeling)
    : null;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <View style={styles.content}>
      {/* Person Header */}
      <View style={styles.personHeader}>
        <View style={styles.avatar}>
          <View style={styles.avatarGradient}>
            <Text style={styles.avatarText}>{getInitials(person.name)}</Text>
          </View>
        </View>
        <Text style={styles.personName}>{person.name}</Text>
        {dominantFeelingData && (
          <Text style={styles.personSummary}>
            Mostly {dominantFeelingData.emoji} {dominantFeelingData.label.toLowerCase()}
          </Text>
        )}
      </View>

      {/* Subtle actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // CRASH FIX: Guard navigation against missing personId
            if (personId) {
              (navigation as any).navigate('LogDate', { personId });
            }
          }}
        >
          <Text style={styles.actionButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowEditDetails(true)}
        >
          <Text style={styles.actionButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Dates - emotion-first */}
      {dates.length === 0 ? (
        <View style={styles.emptyDates}>
          <Text style={styles.emptyDatesText}>
            Your dates with {person.name} will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.datesContainer}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date.id}
              style={styles.dateEntry}
              onPress={() =>
                (navigation as any).navigate('LogDate', { dateId: date.id })
              }
              activeOpacity={0.6}
            >
              <Text style={styles.dateEmoji}>{getFeelingEmoji(date.feeling)}</Text>
              <View style={styles.dateContent}>
                <Text style={styles.dateFeeling}>
                  {FEELINGS.find((f) => f.value === date.feeling)?.label}
                  {date.emoji && <Text style={styles.customEmoji}> {date.emoji}</Text>}
                </Text>
                {(date.activity || date.location) && (
                  <Text style={styles.dateMeta}>
                    {date.activity && date.location 
                      ? `${date.activity} · ${date.location}`
                      : date.activity || date.location}
                  </Text>
                )}
                <Text style={styles.dateTime}>{formatDate(date.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Edit Details Modal */}
      <Modal
        visible={showEditDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditDetails(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit details</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editingName}
              onChangeText={setEditingName}
              placeholder="Name"
            />

            <Text style={styles.modalLabel}>Age</Text>
            <TextInput
              style={styles.modalInput}
              value={editingAge}
              onChangeText={setEditingAge}
              placeholder="Age"
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Profession</Text>
            <TextInput
              style={styles.modalInput}
              value={editingProfession}
              onChangeText={setEditingProfession}
              placeholder="Profession"
            />

            <Text style={styles.modalLabel}>How you met</Text>
            <TextInput
              style={styles.modalInput}
              value={editingHowMet}
              onChangeText={setEditingHowMet}
              placeholder="How you met"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowEditDetails(false);
                  // Reset to original values
                  if (person) {
                    setEditingName(person.name || '');
                    setEditingAge(person.age?.toString() || '');
                    setEditingProfession(person.profession || '');
                    setEditingHowMet(person.how_met || '');
                  }
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmit,
                  (!editingName.trim() || savingDetails) &&
                    styles.modalSubmitDisabled,
                ]}
                onPress={handleSaveDetails}
                disabled={!editingName.trim() || savingDetails}
                activeOpacity={0.8}
              >
                <View style={styles.modalSubmitGradient}>
                  {savingDetails ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Save</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    zIndex: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  loader: {
    marginTop: 100,
  },
  personHeader: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#666',
  },
  avatarText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '700',
  },
  personName: {
    fontSize: 38,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1A1A',
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  personSummary: {
    fontSize: 18,
    color: '#666',
    fontWeight: '400',
  },
  datesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  dateEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  dateEmoji: {
    fontSize: 52,
    marginRight: 24,
  },
  dateContent: {
    flex: 1,
  },
  dateFeeling: {
    fontSize: 30,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  customEmoji: {
    fontSize: 26,
  },
  dateMeta: {
    fontSize: 15,
    color: '#999',
    marginBottom: 6,
    fontWeight: '400',
  },
  dateTime: {
    fontSize: 13,
    color: '#BBB',
    fontWeight: '400',
  },
  emptyDates: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyDatesText: {
    fontSize: 17,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 32,
    paddingBottom: 24,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  snapshot: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  snapshotTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  feelingPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feelingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  feelingPillEmoji: {
    fontSize: 18,
  },
  feelingPillCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addDateButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addDateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 28,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  modalLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 20,
    color: '#1A1A1A',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 8,
  },
  feelingButton: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    margin: 6,
  },
  feelingButtonSelected: {
    borderColor: '#666',
    backgroundColor: '#666',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  feelingButtonEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  feelingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  feelingButtonTextSelected: {
    color: '#fff',
  },
  emojiInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    minHeight: 50,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalSubmit: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalSubmitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#999',
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deletePersonButton: {
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deletePersonButtonDisabled: {
    opacity: 0.6,
  },
  deletePersonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
});
