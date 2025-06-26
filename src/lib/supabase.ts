import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project URL and public anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and/or ANON key are not set in environment variables.');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
