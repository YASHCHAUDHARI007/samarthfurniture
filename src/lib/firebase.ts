
import { createClient } from '@supabase/supabase-js';

// This file seems to be a duplicate of supabase.ts.
// Using supabase.ts as the single source of truth.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and/or ANON key are not set in environment variables.');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
