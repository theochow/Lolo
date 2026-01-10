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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editingActivityValue, setEditingActivityValue] = useState('');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // Scroll to ensure inputs are visible
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShow.remove();
    };
  }, []);

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

  const validateRequiredFields = (): string | null => {
    if (!selectedFeeling) {
      return 'Please select how you felt about the date';
    }
    if (!activity || activity.trim() === '') {
      return 'Please select or enter what you did';
    }
    return null;
  };

  const autoSave = async () => {
    // Auto-save if at least feeling is selected (so user can go back and delete even if incomplete)
    // This allows deletion of partially completed dates
    if (!selectedFeeling) {
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
          person_id: selectedPersonId || null,
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

    // Clear any validation error when fields change
    const validationError = validateRequiredFields();
    if (validationError) {
      setError(validationError);
    } else {
      setError('');
      autoSave();
    }

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedFeeling, selectedPersonId, activity, emoji, greenFlags, redFlags]);

  // Handle manual save/validation when user tries to navigate away
  const handleSave = async () => {
    const validationError = validateRequiredFields();
    if (validationError) {
      Alert.alert(
        'Missing Information',
        validationError + '\n\nPlease complete all required fields before saving.',
        [{ text: 'OK' }]
      );
      setError(validationError);
      return;
    }

    // If validation passes, trigger auto-save
    setError('');
    await autoSave();
  };

  // Allow navigation but warn if data is incomplete
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Check if required fields are missing
        const validationError = validateRequiredFields();
        
        // If date is already saved, allow navigation (they can delete it from feed)
        if (savedDateId) {
          return; // Allow navigation
        }
        
        // If they haven't entered anything, allow navigation
        if (!selectedFeeling && !selectedPersonId && !activity && !emoji && !greenFlags && !redFlags) {
          return; // Allow navigation - nothing entered
        }
        
        // If there's incomplete data, show warning but allow navigation
        if (validationError) {
          e.preventDefault();
          Alert.alert(
            'Incomplete Date',
            validationError + '\n\nThe date will not be logged until you complete all required fields (feeling and activity).',
            [
              {
                text: 'Stay',
                style: 'cancel',
              },
              {
                text: 'Leave Anyway',
                style: 'destructive',
                onPress: () => {
                  navigation.dispatch(e.data.action);
                },
              },
            ]
          );
          return;
        }
        
        // All required fields filled, allow navigation
        return;
      });

      return unsubscribe;
    }, [navigation, selectedFeeling, selectedPersonId, activity, emoji, greenFlags, redFlags, savedDateId])
  );

  const handleDeleteDate = () => {
    const dateIdToDelete = savedDateId || dateId;
    if (!dateIdToDelete) return;
    
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
                .eq('id', dateIdToDelete)
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
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.content}>
        <Text style={styles.title}>
          {selectedPersonName || 'How did it go?'}
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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
              const isCustomActivity = !DEFAULT_ACTIVITIES.includes(act);
              const isEditing = editingActivity === act;
              
              return (
                <View key={act}>
                  {isEditing ? (
                    <TextInput
                      style={styles.activityEditInput}
                      value={editingActivityValue}
                      onChangeText={setEditingActivityValue}
                      onSubmitEditing={async () => {
                        const trimmedValue = editingActivityValue.trim();
                        if (trimmedValue && trimmedValue !== act) {
                          // Update custom activity
                          const updatedCustom = customActivities.map(a => a === act ? trimmedValue : a);
                          setCustomActivities(updatedCustom);
                          setAllActivities([...DEFAULT_ACTIVITIES, ...updatedCustom]);
                          
                          // Update activity if it was selected
                          if (activity === act) {
                            setActivity(trimmedValue);
                          }
                          
                          // Save to AsyncStorage
                          try {
                            await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updatedCustom));
                          } catch (err) {
                            console.error('Error saving custom activity:', err);
                          }
                        }
                        setEditingActivity(null);
                        setEditingActivityValue('');
                      }}
                      onBlur={() => {
                        setEditingActivity(null);
                        setEditingActivityValue('');
                      }}
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.activityCard,
                        { borderColor },
                        activity === act && { backgroundColor: borderColor },
                      ]}
                      onPress={() => {
                        setActivity(act);
                        setShowActivityInput(false);
                      }}
                      onLongPress={() => {
                        if (isCustomActivity) {
                          setEditingActivity(act);
                          setEditingActivityValue(act);
                        }
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
                  )}
                </View>
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
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
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
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
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
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 800);
            }}
          />

          <TextInput
            style={[styles.softInput, styles.multilineInput]}
            placeholder="Anything that gave you pause?"
            placeholderTextColor="rgba(26, 26, 26, 0.3)"
            value={redFlags}
            onChangeText={setRedFlags}
            multiline
            numberOfLines={2}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 200,
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
  content: {
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    marginTop: 20,
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
  activityEditInput: {
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#4ECDC4',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    minWidth: 100,
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
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    fontWeight: '500',
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
