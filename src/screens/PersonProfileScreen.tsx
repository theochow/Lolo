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
} from 'react-native';
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
  const { personId } = route.params;
  const [person, setPerson] = useState<Person | null>(null);
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingAge, setEditingAge] = useState('');
  const [editingProfession, setEditingProfession] = useState('');
  const [editingHowMet, setEditingHowMet] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchPersonAndDates();
    }, [personId])
  );

  const fetchPersonAndDates = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch person
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .eq('user_id', user.id)
        .single();

      if (personError) throw personError;
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

      if (datesError) throw datesError;
      setDates(datesData || []);
    } catch (error) {
      console.error('Error fetching person:', error);
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

      const { data: updatedData, error } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', personId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      // Optimistically update local state
      if (updatedData) {
        setPerson(updatedData);
      }

      setShowEditDetails(false);
      // Refresh to ensure consistency
      fetchPersonAndDates();
    } catch (error: any) {
      console.error('Error saving details:', error);
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

  if (!person) {
    return (
      <View style={styles.container}>
        <Text>Person not found</Text>
      </View>
    );
  }

  const dominantFeeling = getEmotionalSnapshot();
  const dominantFeelingData = dominantFeeling
    ? FEELINGS.find((f) => f.value === dominantFeeling)
    : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
      {/* Person Header */}
      <View style={styles.personHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(person.name)}</Text>
        </View>
        <Text style={styles.personName}>{person.name}</Text>
        <Text style={styles.personSummary}>
          {dates.length} {dates.length === 1 ? 'date' : 'dates'}
          {dominantFeelingData && ` · Mostly ${dominantFeelingData.emoji}`}
        </Text>
      </View>

      {/* Emotional Snapshot */}
      {dates.length > 0 && (
        <View style={styles.snapshot}>
          <Text style={styles.snapshotTitle}>Emotional Snapshot</Text>
          <View style={styles.feelingPills}>
            {FEELINGS.map((feeling) => {
              const count = dates.filter((d) => d.feeling === feeling.value).length;
              if (count === 0) return null;
              return (
                <View key={feeling.value} style={styles.feelingPill}>
                  <Text style={styles.feelingPillEmoji}>{feeling.emoji}</Text>
                  <Text style={styles.feelingPillCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Quick Add Date Button */}
      <TouchableOpacity
        style={styles.addDateButton}
        onPress={() =>
          (navigation as any).navigate('LogDate', { personId: personId })
        }
      >
        <Text style={styles.addDateButtonText}>+ Log a date</Text>
      </TouchableOpacity>

      {/* Dates Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>
        {dates.length === 0 ? (
          <View style={styles.emptyDates}>
            <Text style={styles.emptyDatesText}>
              No dates logged yet. Tap above to add your first one!
            </Text>
          </View>
        ) : (
          dates.map((date) => (
            <TouchableOpacity
              key={date.id}
              style={styles.dateItem}
              onPress={() =>
                (navigation as any).navigate('LogDate', { dateId: date.id })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.dateEmoji}>{getFeelingEmoji(date.feeling)}</Text>
              <View style={styles.dateInfo}>
                <Text style={styles.dateFeeling}>
                  {FEELINGS.find((f) => f.value === date.feeling)?.label}
                  {date.emoji && ` ${date.emoji}`}
                </Text>
                {date.activity && (
                  <Text style={styles.dateMeta}>{date.activity}</Text>
                )}
                {date.location && (
                  <Text style={styles.dateMeta}>{date.location}</Text>
                )}
                <Text style={styles.dateTime}>{formatDate(date.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Person Details (Optional) */}
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => setShowEditDetails(true)}
      >
        <Text style={styles.detailsButtonText}>Edit details</Text>
      </TouchableOpacity>

      {/* Edit Details Modal */}
      <Modal
        visible={showEditDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditDetails(false)}
      >
        <View style={styles.modalOverlay}>
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
              >
                {savingDetails ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    zIndex: 1,
    paddingTop: 60,
  },
  loader: {
    marginTop: 100,
  },
  personHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  personName: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  personSummary: {
    fontSize: 17,
    color: '#666',
    fontWeight: '500',
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
  emptyDates: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyDatesText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  dateItem: {
    flexDirection: 'row',
    padding: 18,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dateEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  dateInfo: {
    flex: 1,
  },
  dateFeeling: {
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1A1A1A',
  },
  dateMeta: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateTime: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
    fontWeight: '500',
  },
  detailsButton: {
    marginHorizontal: 24,
    marginBottom: 40,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderColor: '#5B8DEF',
    backgroundColor: '#5B8DEF',
    shadowColor: '#5B8DEF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#5B8DEF',
    borderRadius: 20,
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
