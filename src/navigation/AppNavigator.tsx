import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { RootStackParamList } from '../types/navigation';

// Import screens - React Native doesn't support React.lazy, but we can optimize by:
// 1. Ensuring screens don't execute heavy code at module level
// 2. Deferring animation setup until after initial render
// MainTabs is always needed, so import it eagerly
import MainTabs from './MainTabs';

// Import auth screens (needed immediately)
import AuthScreen from '../screens/AuthScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// Import main app screens - import eagerly to avoid StyleSheet initialization issues
// The performance optimization of lazy loading is outweighed by crash risk in production
import LogDateScreen from '../screens/LogDateScreen';
import PersonProfileScreen from '../screens/PersonProfileScreen';
import AddPersonScreen from '../screens/AddPersonScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import DisplayNameScreen from '../screens/onboarding/DisplayNameScreen';
import RelationshipStatusScreen from '../screens/onboarding/RelationshipStatusScreen';
import PrimaryIntentsScreen from '../screens/onboarding/PrimaryIntentsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Memoize screen options outside component to prevent recreation
const onboardingScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
  animationDuration: 300,
};

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const checkOnboardingStatus = useCallback(async (userId: string): Promise<boolean> => {
    // Defensive check: ensure userId is valid
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      if (__DEV__) {
        console.error('Invalid userId provided to checkOnboardingStatus:', userId);
      }
      return true; // Assume onboarding needed if userId is invalid
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, relationship_status, primary_intents')
        .eq('id', userId)
        .single();

      if (error) {
        // If no profile exists (PGRST116), user needs onboarding
        if (error.code === 'PGRST116') {
          return true;
        }
        if (__DEV__) {
          console.error('Error checking profile:', {
            error,
            code: error.code,
            message: error.message,
            userId,
          });
        }
        // On error, assume onboarding needed to be safe
        return true;
      }

      // If profile exists, check if onboarding is complete
      // Onboarding is complete if at least one field has data
      // (all fields are optional, so any one indicates completion)
      if (data) {
        const hasOnboardingData = 
          (data.display_name && typeof data.display_name === 'string' && data.display_name.trim() !== '') ||
          (data.relationship_status && typeof data.relationship_status === 'string' && data.relationship_status.trim() !== '') ||
          (Array.isArray(data.primary_intents) && data.primary_intents.length > 0);
        
        return !hasOnboardingData;
      }

      // No profile data means onboarding needed
      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error checking onboarding status:', {
          error,
          userId,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        });
      }
      // On error, assume onboarding needed to be safe
      return true;
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const needsOnboarding = await checkOnboardingStatus(session.user.id);
          setNeedsOnboarding(needsOnboarding);
        }
        setSession(session);
        setLoading(false);
      })
      .catch((error) => {
        if (__DEV__) console.error('Error getting initial session:', error);
        setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setSession(session);
        return;
      }
      if (event === 'USER_UPDATED') {
        setIsPasswordRecovery(false);
      }
      if (session?.user) {
        const needsOnboarding = await checkOnboardingStatus(session.user.id);
        setNeedsOnboarding(needsOnboarding);
      } else {
        setNeedsOnboarding(false);
      }
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  // Separate effect to periodically check onboarding status when onboarding is active
  useEffect(() => {
    if (!needsOnboarding || !session?.user) return;

    let isMounted = true;
    const rapidCheckTimeouts: NodeJS.Timeout[] = [];

    // Check immediately first, then check multiple times rapidly for faster detection
    const checkImmediately = async () => {
      if (!isMounted) return;
      
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (__DEV__) {
            console.error('Error getting session in onboarding check:', sessionError);
          }
          return;
        }

        if (currentSession?.user?.id && isMounted) {
          const stillNeedsOnboarding = await checkOnboardingStatus(currentSession.user.id);
          if (!stillNeedsOnboarding && isMounted) {
            setNeedsOnboarding(false);
            if (__DEV__) {
              console.log('Onboarding complete detected - navigating to main app');
            }
            return; // Exit early if onboarding is complete
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error checking onboarding status:', error);
        }
      }
    };

    // Run immediate check
    checkImmediately();

    // Run additional rapid checks for the first second to catch completion quickly
    [200, 400, 600, 800, 1000].forEach(delay => {
      const timeout = setTimeout(() => {
        if (isMounted && needsOnboarding) {
          checkImmediately();
        }
      }, delay);
      rapidCheckTimeouts.push(timeout);
    });

    // Then check periodically with timeout to prevent infinite loops
    // More aggressive checking: faster interval for quicker detection
    let attemptCount = 0;
    const maxAttempts = 30; // Stop after ~30 seconds (30 * 1000ms)
    
    const interval = setInterval(async () => {
      if (!isMounted) {
        clearInterval(interval);
        return;
      }

      attemptCount++;
      if (attemptCount > maxAttempts) {
        clearInterval(interval);
        if (__DEV__) {
          console.warn('Onboarding check timeout - stopping periodic checks');
        }
        return;
      }

      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (__DEV__) {
            console.error('Error getting session in periodic check:', sessionError);
          }
          return;
        }

        if (currentSession?.user?.id && isMounted) {
          const stillNeedsOnboarding = await checkOnboardingStatus(currentSession.user.id);
          if (!stillNeedsOnboarding && isMounted) {
            setNeedsOnboarding(false);
            clearInterval(interval);
            if (__DEV__) {
              console.log('Onboarding complete detected - navigating to main app');
            }
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error checking onboarding status:', error);
        }
      }
    }, 1000); // Check every 1s while onboarding

    return () => {
      isMounted = false;
      clearInterval(interval);
      // Clear rapid check timeouts
      rapidCheckTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [needsOnboarding, session, checkOnboardingStatus]);

  // CRITICAL FIX: All hooks must be called before any early returns
  // Memoize screen options to prevent recreation on every render
  const defaultScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
  }), []);

  // Memoize screen option objects to prevent recreation
  const logDateScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_bottom' as const,
    animationDuration: 300,
  }), []);

  const personProfileScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  }), []);

  const addPersonScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_bottom' as const,
    animationDuration: 300,
  }), []);

  const editProfileScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  }), []);

  const privacyPolicyScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  }), []);

  const signupScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  }), []);

  const forgotPasswordScreenOptions = useMemo(() => ({
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  }), []);

  // Early return AFTER all hooks
  if (loading) {
    return null;
  }


  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      {isPasswordRecovery ? (
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{ headerShown: false }}
        />
      ) : session ? (
        needsOnboarding ? (
          <>
            <Stack.Screen 
              name="DisplayName" 
              component={DisplayNameScreen}
              options={{ ...onboardingScreenOptions, title: '' }}
            />
            <Stack.Screen 
              name="RelationshipStatus" 
              component={RelationshipStatusScreen}
              options={{ ...onboardingScreenOptions, title: '' }}
            />
            <Stack.Screen 
              name="PrimaryIntents" 
              component={PrimaryIntentsScreen}
              options={{ 
                ...onboardingScreenOptions, 
                title: '', 
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="LogDate" 
              component={LogDateScreen}
              options={logDateScreenOptions}
            />
            <Stack.Screen 
              name="PersonProfile" 
              component={PersonProfileScreen}
              options={personProfileScreenOptions}
            />
            <Stack.Screen 
              name="AddPerson"
              component={AddPersonScreen}
              options={addPersonScreenOptions}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={editProfileScreenOptions}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={privacyPolicyScreenOptions}
            />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={signupScreenOptions}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={forgotPasswordScreenOptions}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
