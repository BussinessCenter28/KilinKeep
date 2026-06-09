// Mutation hook for saving profile preferences. Calls the service, then keeps both
// the query cache and the auth-context profile in sync.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { useAuth } from '@/features/auth/AuthContext';
import { updatePrefs, type PrefsUpdate } from '../services/profileService';

export function useUpdatePrefs() {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: (prefs: PrefsUpdate) => {
      if (!user) throw new Error('You must be signed in.');
      return updatePrefs(user.id, prefs);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.profile });
      await refreshProfile();
    },
  });
}
