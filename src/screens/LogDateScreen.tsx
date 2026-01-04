import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { LogDateScreenProps } from '../types/navigation';
import PersonSelector from '../components/PersonSelector';

const FEELINGS = [
  { label: 'Great', value: 'great' },
  { label: 'Good', value: 'good' },
  { label: 'Meh', value: 'meh' },
  { label: 'Bad', value: 'bad' },
  { label: 'Awful', value: 'awful' },
];

export default function LogDateScreen({ navigation, route }: LogDateScreenProps) {
  const { personId, dateId } = route.params || {};
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [emoji, setEmoji] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    personId || null
  );
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [greenFlags, setGreenFlags] = useState('');
  const [redFlags, setRedFlags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(!!dateId);

  // Load existing date data if editing
  useEffect(() => {
    if (dateId) {
      const loadDateData = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('dates')
            .select('*')
            .eq('id', dateId)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          if (data) {
            setSelectedFeeling(data.feeling);
            setEmoji(data.emoji || '');
            setSelectedPersonId(data.person_id);
            setActivity(data.activity || '');
            setLocation(data.location || '');
            setRating(data.rating);
            setGreenFlags(data.green_flag || '');
            setRedFlags(data.red_flag || '');
          }
        } catch (err) {
          console.error('Error loading date:', err);
        }
      };
      loadDateData();
    }
  }, [dateId]);

  const handleSubmit = async () => {
    if (!selectedFeeling) {
      setError('Please select a feeling');
      return;
    }

    if (!selectedPersonId) {
      setError('Please select or create a person');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Failed to get user. Please try again.');
      }

      // Explicit mapping: UI state → database columns
      const dateData = {
        user_id: user.id,
        person_id: selectedPersonId,
        feeling: selectedFeeling,
        rating: rating || null,
        activity: activity.trim() || null,
        location: location.trim() || null,
        emoji: emoji.trim() || null,
        green_flag: greenFlags.trim() || null,
        red_flag: redFlags.trim() || null,
      };

      if (isEditing && dateId) {
        // Update existing date
        const { error: updateError } = await supabase
          .from('dates')
          .update(dateData)
          .eq('id', dateId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        Alert.alert('Success', 'Date updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        // Insert new date
        const { error: insertError } = await supabase
          .from('dates')
          .insert(dateData);

        if (insertError) throw insertError;

        Alert.alert('Success', 'Date logged successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (selectedPersonId) {
                navigation.navigate('PersonProfile', { personId: selectedPersonId });
              } else {
                navigation.goBack();
              }
            },
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log date. Please try again.');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>{isEditing ? 'Edit date' : 'Log a date'}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>How are you feeling?</Text>
        <View style={styles.feelingGrid}>
          {FEELINGS.map((feeling) => (
            <TouchableOpacity
              key={feeling.value}
              style={[
                styles.feelingButton,
                selectedFeeling === feeling.value && styles.feelingButtonSelected,
              ]}
              onPress={() => {
                setSelectedFeeling(feeling.value);
                setError('');
              }}
            >
              <Text
                style={[
                  styles.feelingButtonText,
                  selectedFeeling === feeling.value && styles.feelingButtonTextSelected,
                ]}
              >
                {feeling.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Emoji</Text>
        <TextInput
          style={styles.emojiInput}
          placeholder="😊"
          value={emoji}
          onChangeText={setEmoji}
          keyboardType="default"
        />
      </View>

      <PersonSelector
        selectedPersonId={selectedPersonId}
        onSelectPerson={(personId) => setSelectedPersonId(personId)}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Activity</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Coffee, dinner, walk..."
          value={activity}
          onChangeText={setActivity}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Where did you go?"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Rating</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star === rating ? null : star)}
              style={styles.starButton}
            >
              <Text
                style={[
                  styles.star,
                  rating !== null && star <= rating && styles.starFilled,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Green flag</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., great listener, funny, kind"
          value={greenFlags}
          onChangeText={setGreenFlags}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Red flag</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., late, rude, no chemistry"
          value={redFlags}
          onChangeText={setRedFlags}
          multiline
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  feelingButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    margin: 6,
  },
  feelingButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  feelingButtonText: {
    fontSize: 16,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 44,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  star: {
    fontSize: 32,
    color: '#ddd',
  },
  starFilled: {
    color: '#FFD700',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
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
    backgroundColor: '#007AFF',
    borderRadius: 8,
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
