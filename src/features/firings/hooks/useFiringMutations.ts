// Write hooks for firings. They keep the TanStack cache consistent after each mutation.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import {
  createFiring,
  updateFiring,
  deleteFiring,
  type FiringInput,
  type FiringPatch,
} from '../services/firingService';

export function useFiringMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: FiringInput) => createFiring(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.firings });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: FiringPatch }) => updateFiring(id, patch),
    onSuccess: (firing) => {
      void qc.invalidateQueries({ queryKey: qk.firings });
      void qc.invalidateQueries({ queryKey: qk.firing(firing.id) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFiring(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: qk.firings });
      void qc.removeQueries({ queryKey: qk.firing(id) });
    },
  });

  return { create, update, remove };
}
