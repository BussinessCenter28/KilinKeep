// Profile preferences service. The only user-updatable columns are default_cone
// and units (a column-level GRANT on the server enforces this; RLS scopes the row
// to the signed-in user). We pass the user id explicitly and let RLS verify it.
import { supabase } from '@/lib/supabase';
import type { Profile, Units } from '@/lib/types';

export interface PrefsUpdate {
  default_cone?: string;
  units?: Units;
}

/** Update the current user's preference columns. Returns the updated profile row. */
export async function updatePrefs(userId: string, prefs: PrefsUpdate): Promise<Profile> {
  // Only forward the two user-updatable columns; never id/plan/ai_credits/timestamps.
  const patch: PrefsUpdate = {};
  if (prefs.default_cone !== undefined) patch.default_cone = prefs.default_cone;
  if (prefs.units !== undefined) patch.units = prefs.units;

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
