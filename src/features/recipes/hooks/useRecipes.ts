// Query/mutation hooks for recipes. Components consume these; they never touch the
// service or supabase directly. Mutations invalidate the relevant query keys so
// every view stays fresh.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import {
  createRecipe,
  deleteRecipe,
  getRecipeWithIngredients,
  listRecipes,
  replaceIngredients,
  updateRecipe,
  type IngredientInput,
  type RecipeInput,
} from '../services/recipeService';

export function useRecipes() {
  return useQuery({
    queryKey: qk.recipes,
    queryFn: listRecipes,
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: qk.recipe(id),
    queryFn: () => getRecipeWithIngredients(id),
    enabled: Boolean(id),
  });
}

export function useRecipeMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (vars: { recipe: RecipeInput; ingredients: IngredientInput[] }) =>
      createRecipe(vars.recipe, vars.ingredients),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.recipes });
    },
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; patch: Partial<RecipeInput> }) =>
      updateRecipe(vars.id, vars.patch),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.recipes });
      void qc.invalidateQueries({ queryKey: qk.recipe(vars.id) });
    },
  });

  const saveIngredients = useMutation({
    mutationFn: (vars: { recipeId: string; ingredients: IngredientInput[] }) =>
      replaceIngredients(vars.recipeId, vars.ingredients),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.recipe(vars.recipeId) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: qk.recipes });
      void qc.removeQueries({ queryKey: qk.recipe(id) });
    },
  });

  return { create, update, saveIngredients, remove };
}
