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
  const [selectedPersonName, setSelectedPersonName] = useState<string | null>(null);
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [greenFlags, setGreenFlags] = useState('');
  const [redFlags, setRedFlags] = useState('');
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
            setRating(data.rating);
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
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {selectedPersonName || 'New date'}
        </Text>

        {/* 1. Tonight's co-star */}
        <PersonSelector
          selectedPersonId={selectedPersonId}
          onSelectPerson={(personId) => setSelectedPersonId(personId)}
        />

        {/* 2. How did it go? */}
        <View style={styles.section}>
          <Text style={styles.label}>How did it go?</Text>
          <View style={styles.feelingGrid}>
            {FEELINGS.map((feeling) => (
              <TouchableOpacity
                key={feeling.value}
                style={[
                  styles.feelingButton,
                  styles.liquidGlass,
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

        {/* 3. What did you do? */}
        <View style={styles.section}>
          <Text style={styles.label}>What did you do?</Text>
          <TextInput
            style={[styles.textInput, styles.liquidGlass]}
            placeholder="Coffee, dinner, walk..."
            placeholderTextColor="rgba(26, 26, 26, 0.4)"
            value={activity}
            onChangeText={setActivity}
          />
        </View>

        {/* 4. Where did you go? */}
        <View style={styles.section}>
          <Text style={styles.label}>Where did you go?</Text>
          <TextInput
            style={[styles.textInput, styles.liquidGlass]}
            placeholder="Location"
            placeholderTextColor="rgba(26, 26, 26, 0.4)"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* 5. Emoji */}
        <View style={styles.section}>
          <Text style={styles.label}>Add an emoji</Text>
          <TextInput
            style={[styles.emojiInput, styles.liquidGlass]}
            placeholder="😊"
            value={emoji}
            onChangeText={setEmoji}
            keyboardType="default"
          />
        </View>

        {/* 6. Green flag */}
        <View style={styles.section}>
          <Text style={styles.label}>Green flag</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput, styles.liquidGlass]}
            placeholder="What stood out in a good way?"
            placeholderTextColor="rgba(26, 26, 26, 0.4)"
            value={greenFlags}
            onChangeText={setGreenFlags}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 7. Red flag */}
        <View style={styles.section}>
          <Text style={styles.label}>Red flag</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput, styles.liquidGlass]}
            placeholder="Anything that gave you pause?"
            placeholderTextColor="rgba(26, 26, 26, 0.4)"
            value={redFlags}
            onChangeText={setRedFlags}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 8. Rating */}
        <View style={styles.section}>
          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star === rating ? null : star)}
                style={styles.starButton}
                activeOpacity={0.7}
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Log</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  content: {
    zIndex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1A1A1A',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  liquidGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  feelingButton: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    margin: 6,
  },
  feelingButtonSelected: {
    borderColor: '#5B8DEF',
    backgroundColor: 'rgba(255, 107, 157, 0.8)',
    shadowColor: '#5B8DEF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  feelingButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  feelingButtonTextSelected: {
    color: '#fff',
  },
  emojiInput: {
    borderRadius: 20,
    padding: 16,
    fontSize: 32,
    textAlign: 'center',
    minHeight: 60,
  },
  textInput: {
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    minHeight: 52,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginHorizontal: -4,
    justifyContent: 'center',
    paddingVertical: 8,
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
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  submitButton: {
    backgroundColor: '#5B8DEF',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});
