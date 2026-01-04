// app.config.js (CommonJS - most compatible)
const path = require('path');
const result = require("dotenv").config({ path: path.resolve(__dirname, '.env') });

// Debug: Check if .env file was loaded
if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Dotenv loaded successfully. Parsed keys:', Object.keys(result.parsed || {}));
}

// Debug: Log environment variables
console.log("ENV CHECK - SUPABASE_URL:", process.env.SUPABASE_URL ? "SET (" + process.env.SUPABASE_URL.substring(0, 20) + "...)" : "NOT SET");
console.log("ENV CHECK - SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "SET (" + process.env.SUPABASE_ANON_KEY.substring(0, 20) + "...)" : "NOT SET");

module.exports = ({ config }) => {
  const appConfig = {
    ...config,
    extra: {
      ...(config.extra || {}),
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  };
  
  // Debug: Log what we're setting in extra
  console.log("APP CONFIG EXTRA:", {
    SUPABASE_URL: appConfig.extra.SUPABASE_URL ? "SET" : "NOT SET",
    SUPABASE_ANON_KEY: appConfig.extra.SUPABASE_ANON_KEY ? "SET" : "NOT SET",
  });
  
  return appConfig;
};