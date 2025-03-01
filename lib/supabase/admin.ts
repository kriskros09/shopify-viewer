import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Check if keys appear to be the same
if (process.env.NEXT_PUBLIC_SUPABASE_API_KEY && 
    supabaseServiceKey === process.env.NEXT_PUBLIC_SUPABASE_API_KEY) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY appears to be the same as NEXT_PUBLIC_SUPABASE_API_KEY. This is likely incorrect.');
  console.warn('The service role key should be different from the anon key and have admin privileges.');
  console.warn('Check your Supabase dashboard under Project Settings > API > Project API keys');
}

// Check if key appears to be an anon key by basic inspection of the JWT
if (supabaseServiceKey.includes('"role":"anon"')) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY appears to be an anon key, not a service role key.');
  console.warn('This will cause permission issues for admin operations.');
}

// Create a Supabase client with admin privileges for server-side operations
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Supabase admin client initialized with service role key');

export default supabaseAdmin; 