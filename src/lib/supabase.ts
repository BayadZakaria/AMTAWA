import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = supabaseUrl && supabaseUrl.trim().startsWith('http');
const isValidKey = supabaseAnonKey && supabaseAnonKey.trim().length > 10;

// Only create the client if the credentials exist so the app doesn't crash on startup
export const supabase = isValidUrl && isValidKey 
  ? createClient(supabaseUrl.trim(), supabaseAnonKey.trim()) 
  : null;
