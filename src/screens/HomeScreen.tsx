import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { HomeScreenProps } from '../types/navigation';

interface DateEntry {
  id: string;
  feeling: string;
  emoji: string | null;
  created_at: string;
  activity: string | null;
  person_id: string | null;
  person_name?: string | null;
}

interface ActivityCount {
  activity: string;
  count: number;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDates, setTotalDates] = useState<number>(0);
  const [currentYearDates, setCurrentYearDates] = useState<number>(0);
  const [activityCounts, setActivityCounts] = useState<ActivityCount[]>([]);
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState('rgba(200, 180, 255, 0.6)');
  const [barGradientColors, setBarGradientColors] = useState<[string, string]>(['rgba(200, 180, 255, 0.8)', 'rgba(255, 200, 180, 0.8)']);

  useEffect(() => {
    const gradientColorAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );

    const borderAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(borderPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    gradientColorAnimation.start();
    borderAnimation.start();

    const listenerId = gradientAnimation.addListener(({ value }) => {
      if (value <= 0.5) {
        const progress = value * 2;
        const color1 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.8)`;
        const color2 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.8)`;
        setBorderColor(`rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, ${0.6 + progress * 0.4})`);
        setBarGradientColors([color1, color2]);
      } else {
        const progress = (value - 0.5) * 2;
        const color1 = `rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, 0.8)`;
        const color2 = `rgba(${200 + Math.floor(55 * progress)}, ${180 + Math.floor(20 * progress)}, ${255 - Math.floor(75 * progress)}, 0.8)`;
        setBorderColor(`rgba(${255 - Math.floor(55 * progress)}, ${200 - Math.floor(20 * progress)}, ${180 + Math.floor(75 * progress)}, ${1 - progress * 0.4})`);
        setBarGradientColors([color1, color2]);
      }
    });

    return () => {
      gradientAnimation.removeListener(listenerId);
    };
  }, []);

  const borderOpacity = borderPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const fetchRecentDates = async () => {
        if (!isMounted) return;
        setLoading(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user || !isMounted) return;

          // Fetch dates with person_id
          const { data, error } = await supabase
            .from('dates')
            .select('id, feeling, emoji, created_at, activity, person_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;

          if (isMounted && data) {
            // Fetch person names for each date
            const datesWithPersonNames = await Promise.all(
              (data || []).map(async (date) => {
                if (date.person_id) {
                  const { data: personData } = await supabase
                    .from('people')
                    .select('name')
                    .eq('id', date.person_id)
                    .eq('user_id', user.id)
                    .single();

                  return {
                    ...date,
                    person_name: personData?.name || null,
                  };
                }
                return {
                  ...date,
                  person_name: null,
                };
              })
            );

            setDates(datesWithPersonNames);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error fetching dates:', error);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      const fetchTotalDates = async () => {
        if (!isMounted) return;
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user || !isMounted) return;

          // Get total dates count
          const { count, error } = await supabase
            .from('dates')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (error) throw error;
          const dateCount = count || 0;
          
          if (isMounted) {
            setTotalDates(dateCount);
          }

          // Get current year dates count
          const currentYear = new Date().getFullYear();
          const startOfYear = new Date(currentYear, 0, 1).toISOString();
          const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

          const { count: yearCount, error: yearError } = await supabase
            .from('dates')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfYear)
            .lte('created_at', endOfYear);

          if (yearError) throw yearError;
          
          if (isMounted) {
            setCurrentYearDates(yearCount || 0);
          }
          
          // Fetch analytics if we have more than 2 dates
          if (dateCount > 2 && isMounted) {
            await fetchActivityAnalytics();
          } else if (isMounted) {
            setActivityCounts([]);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error fetching total dates:', error);
          }
        }
      };

      const fetchActivityAnalytics = async () => {
        if (!isMounted) return;
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user || !isMounted) return;

          const { data, error } = await supabase
            .from('dates')
            .select('activity')
            .eq('user_id', user.id)
            .not('activity', 'is', null);

          if (error) throw error;

          // Count activities
          const counts: Record<string, number> = {};
          data?.forEach((date) => {
            if (date.activity) {
              counts[date.activity] = (counts[date.activity] || 0) + 1;
            }
          });

          // Convert to array and sort by count
          const activityArray: ActivityCount[] = Object.entries(counts)
            .map(([activity, count]) => ({ activity, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4); // Top 4 activities

          if (isMounted) {
            setActivityCounts(activityArray);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error fetching activity analytics:', error);
          }
        }
      };

      // Fetch data in parallel for faster loading
      Promise.all([fetchRecentDates(), fetchTotalDates()]);

      return () => {
        isMounted = false;
      };
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

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };


  const getActivityEmoji = (activity: string) => {
    const emojiMap: Record<string, string> = {
      Coffee: '☕',
      Movie: '🍿',
      Meal: '🍴',
      Dinner: '🍽️',
      Drinks: '🍹',
      Walk: '🚶',
      Golf: '⛳',
    };
    return emojiMap[activity] || '📅';
  };

  const getActivityColor = (index: number) => {
    const colors = [
      'rgba(135, 206, 250, 0.8)', // Light blue
      'rgba(255, 165, 0, 0.8)',   // Orange
      'rgba(144, 238, 144, 0.8)', // Light green
      'rgba(221, 160, 221, 0.8)', // Plum
    ];
    return colors[index % colors.length];
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
              <Ionicons name="person-circle-outline" size={32} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#666" />
        ) : dates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No reflections yet</Text>
            <Text style={styles.emptyText}>Your reflections will appear here</Text>
            <Animated.View
              style={[
                styles.emptyButtonContainer,
                {
                  borderColor: borderColor,
                  opacity: borderOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => (navigation as any).navigate('LogDate')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Log your first date</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <FlatList
            data={dates}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <>
                {dates.length > 0 && (
                  <View style={styles.analyticsContainer}>
                    <Text style={styles.analyticsCount}>
                      You've been on <Text style={styles.analyticsCountBold}>{currentYearDates}</Text> {currentYearDates === 1 ? 'date' : 'dates'} this year.
                    </Text>
                    {totalDates > 2 && activityCounts.length > 0 && (
                      <>
                        <Text style={styles.analyticsQuestion}>What's your playbook?</Text>
                        <View style={styles.activityChart}>
                          {(() => {
                            // Find the maximum count to scale bars relative to the highest
                            const maxCount = activityCounts.length > 0 
                              ? Math.max(...activityCounts.map(item => item.count))
                              : 1;
                            
                            return activityCounts.map((item, index) => {
                              // Calculate percentage based on max count - highest count gets 100% width
                              const widthPercent = maxCount > 0 
                                ? (item.count / maxCount) * 100 
                                : 0;
                              return (
                                <View key={item.activity} style={styles.activityBarContainer}>
                                  <View style={styles.activityBarRow}>
                                    <View style={styles.activityBarLabel}>
                                      <Text style={styles.activityEmoji}>{getActivityEmoji(item.activity)}</Text>
                                      <Text style={styles.activityName}>{item.activity}</Text>
                                    </View>
                                    <View style={styles.activityBarContainerWrapper}>
                                      <View
                                        style={[
                                          styles.activityBarWrapper,
                                          {
                                            width: `${widthPercent}%`,
                                          },
                                        ]}
                                      >
                                        <LinearGradient
                                          colors={barGradientColors}
                                          style={styles.activityBarGradient}
                                          start={{ x: 0, y: 0 }}
                                          end={{ x: 1, y: 0 }}
                                        />
                                      </View>
                                    </View>
                                  </View>
                                </View>
                              );
                            });
                          })()}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </>
            }
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
                  <View style={styles.metaRow}>
                    {item.person_name && (
                      <Text style={styles.personName}>{item.person_name}</Text>
                    )}
                    <Text style={styles.metaText}>{getRelativeTime(item.created_at)}</Text>
                  </View>
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
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    backgroundColor: '#FAFAFA',
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
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'absolute',
    right: 0,
  },
  profileIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCount: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '400',
  },
  analyticsContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  analyticsCount: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  analyticsCountBold: {
    fontSize: 20,
    fontWeight: '700',
  },
  analyticsQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  activityChart: {
    gap: 14,
  },
  activityBarContainer: {
    marginBottom: 2,
  },
  activityBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  activityEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  activityBarContainerWrapper: {
    flex: 1,
    maxWidth: '100%',
  },
  activityBarWrapper: {
    height: 16,
    borderRadius: 8,
    minWidth: 40,
    overflow: 'hidden',
  },
  activityBarGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    color: '#666',
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButtonContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  emptyButton: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  emptyButtonText: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  listContent: {
    paddingBottom: 40,
  },
  dateEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  metaText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
});
