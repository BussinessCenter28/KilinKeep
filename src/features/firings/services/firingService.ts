// All Supabase access for firings lives here. Hooks call these; components never do.
// The frontend is untrusted: anon client only, RLS scopes rows to the owner.
import { supabase } from '@/lib/supabase';
import type { Firing } from '@/lib/types';

// Insert payload: omit id/user_id/created_at/updated_at (DB fills them, user_id via
// auth.uid() default). The caller supplies the editable columns only.
export type FiringInput = Pick<
  Firing,
  'kiln' | 'date' | 'type' | 'target_cone' | 'atmosphere' | 'schedule' | 'cost' | 'notes'
>;
export type FiringPatch = Partial<FiringInput>;

// Firing logs are small per user; bound the fetch (switch to keyset if ever needed).
const LIST_LIMIT = 500;

/** List the signed-in user's firings: most recent firing date first (nulls last), then newest created. */
export async function listFirings(): Promise<Firing[]> {
  const { data, error } = await supabase
    .from('firings')
    .select('*')
    .order('date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data ?? [];
}

/** Fetch one firing by id (RLS returns it only if it's the user's own). */
export async function getFiring(id: string): Promise<Firing | null> {
  const { data, error } = await supabase
    .from('firings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createFiring(input: FiringInput): Promise<Firing> {
  const { data, error } = await supabase
    .from('firings')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateFiring(id: string, patch: FiringPatch): Promise<Firing> {
  const { data, error } = await supabase
    .from('firings')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFiring(id: string): Promise<void> {
  const { error } = await supabase.from('firings').delete().eq('id', id);
  if (error) throw error;
}
