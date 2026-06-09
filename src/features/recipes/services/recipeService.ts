// All Supabase access for recipes. Hooks call these; components never do. RLS scopes
// every query to the signed-in user — on INSERT we OMIT user_id (DB default fills it)
// and omit id/created_at/updated_at.
import { supabase } from '@/lib/supabase';
import type { Recipe, RecipeWithIngredients } from '@/lib/types';

export interface IngredientInput {
  material: string;
  percent: number;
}

export interface RecipeInput {
  name: string;
  type: Recipe['type'];
  cone: string | null;
  notes: string | null;
}

// Recipe libraries are small per user; we bound the fetch so a runaway library can
// never over-fetch. If anyone ever approaches this, switch to keyset pagination.
const LIST_LIMIT = 500;

/** All of the user's recipes, A→Z by name (bounded). */
export async function listRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('name', { ascending: true })
    .limit(LIST_LIMIT);
  if (error) throw error;
  return data ?? [];
}

/** One recipe with its ingredient rows, or null if not found / not owned. */
export async function getRecipeWithIngredients(id: string): Promise<RecipeWithIngredients | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as RecipeWithIngredients | null;
}

/** Create a recipe, then insert its ingredients linked to the new id. */
export async function createRecipe(recipe: RecipeInput, ingredients: IngredientInput[]): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({ name: recipe.name, type: recipe.type, cone: recipe.cone, notes: recipe.notes })
    .select('*')
    .single();
  if (error) throw error;

  const rows = ingredients.map((i) => ({ recipe_id: data.id, material: i.material, percent: i.percent }));
  if (rows.length > 0) {
    const { error: ingError } = await supabase.from('recipe_ingredients').insert(rows);
    if (ingError) throw ingError;
  }
  return data;
}

/** Update recipe fields (name/type/cone/notes). */
export async function updateRecipe(id: string, patch: Partial<RecipeInput>): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Replace a recipe's ingredient set: delete existing rows, then insert the new ones. */
export async function replaceIngredients(recipeId: string, ingredients: IngredientInput[]): Promise<void> {
  const { error: delError } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('recipe_id', recipeId);
  if (delError) throw delError;

  const rows = ingredients.map((i) => ({ recipe_id: recipeId, material: i.material, percent: i.percent }));
  if (rows.length > 0) {
    const { error: insError } = await supabase.from('recipe_ingredients').insert(rows);
    if (insError) throw insError;
  }
}

/** Delete a recipe (recipe_ingredients cascade in the DB). */
export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}
