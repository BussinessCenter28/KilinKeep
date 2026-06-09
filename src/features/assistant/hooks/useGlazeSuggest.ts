// Mutation: ask the Assistant about a test. On success a credit was spent, so we
// refresh the profile to update the remaining-credit display.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { useAuth } from '@/features/auth/AuthContext';
import { getGlazeSuggestion } from '../services/assistantService';

export function useGlazeSuggest() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: (testId: string) => getGlazeSuggestion(testId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.profile });
      await refreshProfile();
    },
  });
}
