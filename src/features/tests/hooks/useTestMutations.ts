// Create / update / delete a test, invalidating the right cache keys after each.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import {
  createTest,
  updateTest,
  deleteTest,
  type CreateTestInput,
  type UpdateTestPatch,
} from '../services/testService';

export function useTestMutations() {
  const qc = useQueryClient();

  const invalidateLists = () => {
    void qc.invalidateQueries({ queryKey: ['tests'] });
    void qc.invalidateQueries({ queryKey: qk.profile });
  };

  const create = useMutation({
    mutationFn: (input: CreateTestInput) => createTest(input),
    onSuccess: () => invalidateLists(),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTestPatch }) => updateTest(id, patch),
    onSuccess: (_data, vars) => {
      invalidateLists();
      void qc.invalidateQueries({ queryKey: qk.test(vars.id) });
      void qc.invalidateQueries({ queryKey: qk.testLineage(vars.id) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onSuccess: (_data, id) => {
      invalidateLists();
      void qc.invalidateQueries({ queryKey: qk.test(id) });
    },
  });

  return { create, update, remove };
}
