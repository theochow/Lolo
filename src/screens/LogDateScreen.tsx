import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { LogDateScreenProps } from '../types/navigation';
import PersonSelector from '../components/PersonSelector';

const ACTIVITY_STORAGE_KEY = '@lolo_custom_activities';
const DEFAULT_ACTIVITIES = ['Coffee', 'Dinner', 'Drinks', 'Walk', 'Movie', 'Activity'];

const EMOJI_OPTIONS = ['😊', '😍', '🥰', '😎', '🤩', '😌', '🙂', '😋', '🤗', '😄', '😃', '😁', '✨', '💫', '🌟', '💖', '💕', '🎉', '🎊', '🔥'];
const getRandomEmoji = () => EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];

const FEELINGS = [
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
  const [greenFlags, setGreenFlags] = useState('');
  const [redFlags, setRedFlags] = useState('');
  const [showActivityInput, setShowActivityInput] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(!!dateId);
  const [customActivities, setCustomActivities] = useState<string[]>([]);
  const [allActivities, setAllActivities] = useState<string[]>(DEFAULT_ACTIVITIES);
  const [randomEmoji] = useState(() => getRandomEmoji());
  const [savedDateId, setSavedDateId] = useState<string | null>(dateId || null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  // Load custom activities from storage
  useEffect(() => {
    const loadCustomActivities = async () => {
      try {
        const stored = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCustomActivities(parsed);
          setAllActivities([...DEFAULT_ACTIVITIES, ...parsed]);
        }
      } catch (err) {
        console.error('Error loading custom activities:', err);
      }
    };
    loadCustomActivities();
  }, []);

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
            setGreenFlags(data.green_flag || '');
            setRedFlags(data.red_flag || '');
            setSavedDateId(data.id);
            hasInitializedRef.current = true; // Mark as initialized after loading
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

  const autoSave = async () => {
    // Don't auto-save if required fields are missing
    if (!selectedFeeling || !selectedPersonId) {
      return;
    }

    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    autoSaveTimeoutRef.current = setTimeout(async () => {
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
          emoji: emoji.trim() || null,
          green_flag: greenFlags.trim() || null,
          red_flag: redFlags.trim() || null,
        };

        if (savedDateId) {
          // Update existing date
          const { error: updateError } = await supabase
            .from('dates')
            .update(dateData)
            .eq('id', savedDateId)
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        } else {
          // Insert new date
          const { data: insertedData, error: insertError } = await supabase
            .from('dates')
            .insert(dateData)
            .select('id')
            .single();

          if (insertError) throw insertError;
          
          if (insertedData) {
            setSavedDateId(insertedData.id);
            setIsEditing(true);
          }
        }
      } catch (err: any) {
        console.error('Auto-save error:', err);
        // Don't show error to user for auto-save failures
      } finally {
        setLoading(false);
      }
    }, 1000); // 1 second debounce
  };

  // Auto-save when form fields change
  useEffect(() => {
    // Skip auto-save on initial load
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    autoSave();

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedFeeling, selectedPersonId, activity, emoji, greenFlags, redFlags]);

  const handleDeleteDate = () => {
    if (!dateId) return;
    
    Alert.alert(
      'Delete Date',
      'Are you sure you want to delete this date? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                throw new Error('User not authenticated');
              }

              const { error: deleteError } = await supabase
                .from('dates')
                .delete()
                .eq('id', dateId)
                .eq('user_id', user.id);

              if (deleteError) {
                throw deleteError;
              }

              navigation.goBack();
            } catch (error: any) {
              console.error('Error deleting date:', error);
              Alert.alert('Error', 'Failed to delete date. Please try again.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                style={styles.feelingButton}
                onPress={() => {
                  setSelectedFeeling(feeling.value);
                  setError('');
                }}
                activeOpacity={0.7}
              >
                {selectedFeeling === feeling.value && (
                  <View style={styles.feelingButtonGradient} />
                )}
                <Text style={[
                  selectedFeeling === feeling.value 
                    ? styles.feelingButtonTextSelected 
                    : styles.feelingButtonText
                ]}>
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
          <Text style={styles.sectionLabelCentered}>What did you do?</Text>
          <View style={styles.activityCards}>
            {allActivities.map((act, index) => {
              const borderColors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#C77DFF', '#FF8C42', '#9B59B6', '#FF6B6B'];
              const borderColor = borderColors[index % borderColors.length];
              return (
                <TouchableOpacity
                  key={act}
                  style={[
                    styles.activityCard,
                    { borderColor },
                    activity === act && { backgroundColor: borderColor },
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
              );
            })}
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
              onSubmitEditing={async () => {
                if (newActivity.trim()) {
                  const trimmedActivity = newActivity.trim();
                  setActivity(trimmedActivity);
                  
                  // Add to custom activities if not already present
                  if (!allActivities.includes(trimmedActivity)) {
                    const updatedCustom = [...customActivities, trimmedActivity];
                    setCustomActivities(updatedCustom);
                    setAllActivities([...DEFAULT_ACTIVITIES, ...updatedCustom]);
                    
                    // Save to AsyncStorage
                    try {
                      await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updatedCustom));
                    } catch (err) {
                      console.error('Error saving custom activity:', err);
                    }
                  }
                  
                  setNewActivity('');
                  setShowActivityInput(false);
                }
              }}
              autoFocus
            />
          )}

          <View style={styles.emojiSection}>
            <Text style={styles.flagLabel}>Emoji to describe the date</Text>
            <TextInput
              style={styles.emojiInput}
              placeholder={randomEmoji}
              value={emoji}
              onChangeText={setEmoji}
              keyboardType="default"
              maxLength={2}
            />
          </View>

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
        {loading && (
          <View style={styles.autoSaveIndicator}>
            <ActivityIndicator size="small" color="#999" />
            <Text style={styles.autoSaveText}>Saving...</Text>
          </View>
        )}

        {savedDateId && (
          <TouchableOpacity
            style={[styles.deleteDateButton, deleting && styles.deleteDateButtonDisabled]}
            onPress={handleDeleteDate}
            disabled={deleting}
            activeOpacity={0.7}
          >
            {deleting ? (
              <ActivityIndicator color="#666" />
            ) : (
              <Text style={styles.deleteDateText}>Delete date</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 16,
    marginTop: 8,
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
  sectionLabelCentered: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    textAlign: 'center',
  },
  activityCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    justifyContent: 'center',
  },
  activityCard: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  feelingButtonGradient: {
    borderRadius: 18,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#666',
  },
  feelingButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    zIndex: 1,
  },
  feelingButtonTextSelected: {
    color: '#fff',
    zIndex: 1,
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
  emojiSection: {
    marginTop: 8,
    marginBottom: 24,
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
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  autoSaveText: {
    color: '#999',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  deleteDateButton: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteDateButtonDisabled: {
    opacity: 0.6,
  },
  deleteDateText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
});
