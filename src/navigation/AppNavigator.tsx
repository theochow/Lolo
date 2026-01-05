import React, { useEffect, useState, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { RootStackParamList } from '../types/navigation';
import AuthScreen from '../screens/AuthScreen';
import SignupScreen from '../screens/SignupScreen';
import MainTabs from './MainTabs';
import LogDateScreen from '../screens/LogDateScreen';
import PersonProfileScreen from '../screens/PersonProfileScreen';
import AddPersonScreen from '../screens/AddPersonScreen';
import DisplayNameScreen from '../screens/onboarding/DisplayNameScreen';
import RelationshipStatusScreen from '../screens/onboarding/RelationshipStatusScreen';
import PrimaryIntentsScreen from '../screens/onboarding/PrimaryIntentsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const onboardingScreenOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: '#FAFAFA',
  },
  headerTintColor: '#333',
  headerTitleStyle: {
    color: '#1A1A1A',
    fontWeight: '600' as const,
  },
  headerBackTitle: 'Back',
};

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkOnboardingStatus = useCallback(async (userId: string): Promise<boolean> => {
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
        console.error('Error checking profile:', error);
        // On error, assume onboarding needed to be safe
        return true;
      }

      // If profile exists, check if onboarding is complete
      // Onboarding is complete if at least one field has data
      // (all fields are optional, so any one indicates completion)
      if (data) {
        const hasOnboardingData = 
          (data.display_name && data.display_name.trim() !== '') ||
          (data.relationship_status && data.relationship_status.trim() !== '') ||
          (data.primary_intents && Array.isArray(data.primary_intents) && data.primary_intents.length > 0);
        
        return !hasOnboardingData;
      }

      // No profile data means onboarding needed
      return true;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // On error, assume onboarding needed to be safe
      return true;
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const needsOnboarding = await checkOnboardingStatus(session.user.id);
        setNeedsOnboarding(needsOnboarding);
      }
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

    // Check immediately first
    const checkImmediately = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          const stillNeedsOnboarding = await checkOnboardingStatus(currentSession.user.id);
          if (!stillNeedsOnboarding) {
            setNeedsOnboarding(false);
            return; // Exit early if onboarding is complete
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkImmediately();

    // Then check periodically
    const interval = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          const stillNeedsOnboarding = await checkOnboardingStatus(currentSession.user.id);
          if (!stillNeedsOnboarding) {
            setNeedsOnboarding(false);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    }, 200); // Check every 200ms while onboarding

    return () => clearInterval(interval);
  }, [needsOnboarding, session, checkOnboardingStatus]);

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
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
              options={{ 
                headerShown: true, 
                title: 'Log a Date',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: '#FAFAFA',
                },
                headerTintColor: '#333',
                headerTitleStyle: {
                  color: '#1A1A1A',
                  fontWeight: '600',
                },
              }}
            />
            <Stack.Screen 
              name="PersonProfile" 
              component={PersonProfileScreen}
              options={{ 
                headerShown: true, 
                title: 'Person Profile',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: '#FAFAFA',
                },
                headerTintColor: '#333',
                headerTitleStyle: {
                  color: '#1A1A1A',
                  fontWeight: '600',
                },
              }}
            />
            <Stack.Screen 
              name="AddPerson" 
              component={AddPersonScreen}
              options={{ 
                headerShown: true, 
                title: 'Add Person',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: '#FAFAFA',
                },
                headerTintColor: '#333',
                headerTitleStyle: {
                  color: '#1A1A1A',
                  fontWeight: '600',
                },
              }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ 
                headerShown: true, 
                title: 'Edit Profile',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: '#FAFAFA',
                },
                headerTintColor: '#333',
                headerTitleStyle: {
                  color: '#1A1A1A',
                  fontWeight: '600',
                },
              }}
            />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen}
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#FAFAFA',
              },
              headerTintColor: '#333',
              headerTitleStyle: {
                color: '#1A1A1A',
                fontWeight: '600',
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
