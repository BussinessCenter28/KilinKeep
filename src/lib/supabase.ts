import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from './types';

// The ONE Supabase client for the whole app. ANON KEY ONLY — never a service-role
// key. All data access is gated by Row Level Security on the server; the frontend
// is treated as untrusted. Privileged work goes through Edge Functions, not here.
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
