// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In development, you might want to throw an error.
  // In production, Vercel environment variables will be used.
  console.error("Supabase URL or Anon Key is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.");
  // Fallback or throw error, depending on how you want to handle missing env vars
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);