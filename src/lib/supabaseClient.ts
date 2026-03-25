import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from 'react-native';

// Lazy initialization to prevent module-level errors before React Native is ready
let supabaseInstance: SupabaseClient | null = null;
let initializationError: Error | null = null;

function initializeSupabase(): SupabaseClient {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Throw cached error if initialization previously failed
  if (initializationError) {
    throw initializationError;
  }

  // Read environment variables - EAS will inject these during build
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Runtime validation - throw clear error if missing (fail fast in production)
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = __DEV__
      ? `Missing Supabase environment variables.

Required variables:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

For local development: Set these in your .env file
For production builds: Set these via EAS environment variables:
  eas env:create --scope project --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_URL"
  eas env:create --scope project --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_KEY"`
      : "Missing Supabase configuration. Check environment variables.";
    
    initializationError = new Error("Missing Supabase configuration. Check environment variables.");
    
    if (__DEV__) {
      console.error(errorMessage);
    }
    
    throw initializationError;
  }

  // Create client instance
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  return supabaseInstance;
}

// Export a proxy that lazily initializes the client when accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = initializeSupabase();
    const value = (client as any)[prop];
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
