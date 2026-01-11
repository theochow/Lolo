// app.config.js - Production-ready Expo config
// Load dotenv in development to read .env file
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

module.exports = ({ config }) => {
  // Support both EXPO_PUBLIC_ prefixed and non-prefixed env vars for backward compatibility
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  // Set EXPO_PUBLIC_ prefixed vars if they don't exist (for runtime access)
  if (supabaseUrl && !process.env.EXPO_PUBLIC_SUPABASE_URL) {
    process.env.EXPO_PUBLIC_SUPABASE_URL = supabaseUrl;
  }
  if (supabaseKey && !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = supabaseKey;
  }
  
  const appConfig = {
    ...config,
    extra: {
      ...(config.extra || {}),
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: supabaseKey,
    },
  };
  
  return appConfig;
};
