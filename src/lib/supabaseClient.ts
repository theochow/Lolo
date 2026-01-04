import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

// Debug: Log what we're getting from Constants
console.log("SUPABASE CLIENT - Constants.expoConfig?.extra:", {
  SUPABASE_URL: supabaseUrl ? "SET" : "NOT SET",
  SUPABASE_ANON_KEY: supabaseAnonKey ? "SET" : "NOT SET",
  fullExtra: Constants.expoConfig?.extra,
});

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `Missing Supabase environment variables. 
  
Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file or environment variables.
  
To fix this:
1. Create a .env file in the root directory
2. Add your Supabase credentials:
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
3. Restart the Expo development server`;

  console.error(errorMessage);
  throw new Error("Missing Supabase environment variables. Check console for details.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});