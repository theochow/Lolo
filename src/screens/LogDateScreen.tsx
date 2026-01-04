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
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { LogDateScreenProps } from '../types/navigation';
import PersonSelector from '../components/PersonSelector';

const FEELINGS = [
  { label: 'Awful', value: 'awful' },
  { label: 'Bad', value: 'bad' },
  { label: 'Meh', value: 'meh' },
  { label: 'Good', value: 'good' },
  { label: 'Great', value: 'great' },
];

export default function LogDateScreen({ navigation, route }: LogDateScreenProps) {
  const { personId, dateId } = route.params || {};
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [emoji, setEmoji] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    personId || null
  );
  const [selectedPersonName, setSelectedPersonName] = useState<string | null>(null);
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [greenFlags, setGreenFlags] = useState('');
  const [redFlags, setRedFlags] = useState('');
  const [showActivityInput, setShowActivityInput] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(!!dateId);

  // Fetch person name when selected
  useEffect(() => {
    const fetchPersonName = async () => {
      if (selectedPersonId) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('people')
            .select('name')
            .eq('id', selectedPersonId)
            .eq('user_id', user.id)
            .single();

          if (!error && data) {
            setSelectedPersonName(data.name);
          }
        } catch (err) {
          console.error('Error fetching person name:', err);
        }
      } else {
        setSelectedPersonName(null);
      }
    };
    fetchPersonName();
  }, [selectedPersonId]);

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
            setGreenFlags(data.green_flag || '');
            setRedFlags(data.red_flag || '');
          }
        } catch (err) {
          console.error('Error loading date:', err);
        }
      };
      loadDateData();
    } else if (personId) {
      setSelectedPersonId(personId);
    }
  }, [dateId, personId]);

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
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {selectedPersonName || 'How did it go?'}
        </Text>

        {/* Feeling - the focal point */}
        <View style={styles.section}>
          <View style={styles.feelingContainer}>
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
                activeOpacity={0.7}
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

        {/* Person selector - subtle */}
        <View style={styles.subtleSection}>
          <PersonSelector
            selectedPersonId={selectedPersonId}
            onSelectPerson={(personId) => setSelectedPersonId(personId)}
          />
        </View>

        {/* Optional details - visually stepped back */}
        <View style={styles.optionalSection}>
          <Text style={styles.sectionLabel}>What did you do?</Text>
          <View style={styles.activityCards}>
            {['Coffee', 'Dinner', 'Drinks', 'Walk', 'Movie', 'Activity'].map((act) => (
              <TouchableOpacity
                key={act}
                style={[
                  styles.activityCard,
                  activity === act && styles.activityCardSelected,
                ]}
                onPress={() => {
                  setActivity(act);
                  setShowActivityInput(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.activityCardText,
                    activity === act && styles.activityCardTextSelected,
                  ]}
                >
                  {act}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.activityCard}
              onPress={() => setShowActivityInput(!showActivityInput)}
              activeOpacity={0.7}
            >
              <Text style={styles.activityCardText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {showActivityInput && (
            <TextInput
              style={styles.softInput}
              placeholder="Enter activity"
              placeholderTextColor="rgba(26, 26, 26, 0.3)"
              value={newActivity}
              onChangeText={setNewActivity}
              onSubmitEditing={() => {
                if (newActivity.trim()) {
                  setActivity(newActivity.trim());
                  setNewActivity('');
                  setShowActivityInput(false);
                }
              }}
              autoFocus
            />
          )}

          <Text style={styles.sectionLabel}>Where?</Text>
          <TextInput
            style={styles.softInput}
            placeholder="Location"
            placeholderTextColor="rgba(26, 26, 26, 0.3)"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.flagLabel}>Emoji to describe the date</Text>
          <TextInput
            style={styles.emojiInput}
            placeholder="😊"
            value={emoji}
            onChangeText={setEmoji}
            keyboardType="default"
          />

          <Text style={styles.flagLabel}>Spill the tea</Text>
          <TextInput
            style={[styles.softInput, styles.multilineInput]}
            placeholder="What stood out?"
            placeholderTextColor="rgba(26, 26, 26, 0.3)"
            value={greenFlags}
            onChangeText={setGreenFlags}
            multiline
            numberOfLines={2}
          />

          <TextInput
            style={[styles.softInput, styles.multilineInput]}
            placeholder="Anything that gave you pause?"
            placeholderTextColor="rgba(26, 26, 26, 0.3)"
            value={redFlags}
            onChangeText={setRedFlags}
            multiline
            numberOfLines={2}
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
            <Text style={styles.submitButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  content: {
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  section: {
    marginBottom: 32,
  },
  subtleSection: {
    marginBottom: 32,
    opacity: 0.8,
  },
  optionalSection: {
    marginTop: 8,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    alignSelf: 'flex-start',
  },
  activityCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  activityCard: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activityCardSelected: {
    backgroundColor: '#5B8DEF',
    borderColor: '#5B8DEF',
  },
  activityCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  activityCardTextSelected: {
    color: '#fff',
  },
  feelingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  feelingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  feelingButtonSelected: {
    backgroundColor: '#5B8DEF',
  },
  feelingButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  feelingButtonTextSelected: {
    color: '#fff',
  },
  flagLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    alignSelf: 'flex-start',
  },
  softInput: {
    borderRadius: 20,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    alignSelf: 'stretch',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 18,
  },
  emojiInput: {
    borderRadius: 20,
    padding: 16,
    fontSize: 32,
    textAlign: 'center',
    backgroundColor: '#F5F5F5',
    minWidth: 80,
    minHeight: 60,
    alignSelf: 'flex-start',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  submitButton: {
    backgroundColor: '#5B8DEF',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
    minWidth: 120,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});
