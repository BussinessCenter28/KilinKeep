// Lookup data the TestForm needs: the user's recipes, firings, and existing tests
// (for the parent picker). Cross-feature reads go through the other features' public
// service signatures; the parent list reuses this feature's listTests.
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { listRecipes } from '@/features/recipes/services/recipeService';
import { listFirings } from '@/features/firings/services/firingService';
import { listTests } from '../services/testService';

export function useRecipeOptions() {
  return useQuery({
    queryKey: qk.recipes,
    queryFn: () => listRecipes(),
  });
}

export function useFiringOptions() {
  return useQuery({
    queryKey: qk.firings,
    queryFn: () => listFirings(),
  });
}

/** A modest page of recent tests to pick a parent from. */
export function useParentTestOptions() {
  return useQuery({
    queryKey: qk.tests({ kind: 'parent-options' }),
    queryFn: () => listTests({ limit: 50 }),
  });
}
