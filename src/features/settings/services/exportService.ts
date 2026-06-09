// Data export service. Gathers everything the signed-in user owns and downloads it
// as a single JSON file. All reads go through the anon client; RLS scopes every row
// to the current user, so there is no need to filter by user_id here.
//
// NOTE (v1): photo BINARIES are NOT zipped/bundled. The JSON includes 1-hour signed
// URLs for each photo's storage object so the user can fetch them before they expire.
// Bundling binaries (e.g. a real .zip) is a future enhancement.
import { supabase } from '@/lib/supabase';
import { getSignedUrls } from '@/lib/storage';
import type {
  Profile,
  Recipe,
  RecipeIngredient,
  Firing,
  Test,
  TestPhoto,
} from '@/lib/types';

interface RecipeExport extends Recipe {
  recipe_ingredients: RecipeIngredient[];
}

interface TestPhotoExport extends TestPhoto {
  signed_url: string | null;
}

export interface ExportBundle {
  exported_at: string;
  version: 1;
  profile: Profile | null;
  recipes: RecipeExport[];
  firings: Firing[];
  tests: Test[];
  test_photos: TestPhotoExport[];
}

async function fetchExportBundle(): Promise<ExportBundle> {
  // Run the independent reads together; RLS limits each to the current user.
  // Recipes and ingredients are fetched separately and joined in code (keeps the
  // typing simple and avoids fragile embedded-select inference).
  const [profileRes, recipesRes, ingredientsRes, firingsRes, testsRes, photosRes] =
    await Promise.all([
      supabase.from('profiles').select('*').maybeSingle(),
      supabase.from('recipes').select('*').order('created_at', { ascending: false }),
      supabase.from('recipe_ingredients').select('*').order('created_at', { ascending: false }),
      supabase.from('firings').select('*').order('created_at', { ascending: false }),
      supabase.from('tests').select('*').order('created_at', { ascending: false }),
      supabase.from('test_photos').select('*').order('created_at', { ascending: false }),
    ]);

  if (profileRes.error) throw profileRes.error;
  if (recipesRes.error) throw recipesRes.error;
  if (ingredientsRes.error) throw ingredientsRes.error;
  if (firingsRes.error) throw firingsRes.error;
  if (testsRes.error) throw testsRes.error;
  if (photosRes.error) throw photosRes.error;

  const photos = photosRes.data ?? [];
  const paths = photos.map((p) => p.storage_path);
  const urlByPath = await getSignedUrls(paths);

  const test_photos: TestPhotoExport[] = photos.map((p) => ({
    ...p,
    signed_url: urlByPath[p.storage_path] ?? null,
  }));

  // Group ingredients under their recipe.
  const ingredientsByRecipe = new Map<string, RecipeIngredient[]>();
  for (const ing of ingredientsRes.data ?? []) {
    const list = ingredientsByRecipe.get(ing.recipe_id);
    if (list) list.push(ing);
    else ingredientsByRecipe.set(ing.recipe_id, [ing]);
  }

  const recipes: RecipeExport[] = (recipesRes.data ?? []).map((r) => ({
    ...r,
    recipe_ingredients: ingredientsByRecipe.get(r.id) ?? [],
  }));

  return {
    exported_at: new Date().toISOString(),
    version: 1,
    profile: profileRes.data,
    recipes,
    firings: firingsRes.data ?? [],
    tests: testsRes.data ?? [],
    test_photos,
  };
}

/** Build a JSON blob of the user's data and trigger a browser download. */
export async function exportMyData(): Promise<void> {
  const bundle = await fetchExportBundle();
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = bundle.exported_at.slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kilnkeep-export-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click so the browser has time to start the download.
  URL.revokeObjectURL(url);
}
