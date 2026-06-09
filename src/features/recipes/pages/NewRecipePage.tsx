// Create a recipe with its ingredients, then go to the new detail page.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecipeForm, type RecipeFormValues } from '../components/RecipeForm';
import { IngredientEditor, emptyRow, type IngredientRow } from '../components/IngredientEditor';
import { useRecipeMutations } from '../hooks/useRecipes';
import { Button, ErrorBanner } from '@/components/ui';
import { toFriendlyMessage } from '@/lib/errors';

const INITIAL_FORM: RecipeFormValues = { name: '', type: 'glaze', cone: '', notes: '' };

export function NewRecipePage() {
  const navigate = useNavigate();
  const { create } = useRecipeMutations();

  const [form, setForm] = useState<RecipeFormValues>(INITIAL_FORM);
  const [rows, setRows] = useState<IngredientRow[]>([emptyRow()]);

  const canSave = form.name.trim().length > 0 && !create.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    const ingredients = rows
      .filter((r) => r.material.trim().length > 0)
      .map((r) => ({ material: r.material.trim(), percent: Number.parseFloat(r.percent) || 0 }));

    create.mutate(
      {
        recipe: {
          name: form.name.trim(),
          type: form.type,
          cone: form.cone.trim() || null,
          notes: form.notes.trim() || null,
        },
        ingredients,
      },
      {
        onSuccess: (recipe) => navigate(`/recipes/${recipe.id}`),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="page-title">New recipe</h1>

      <RecipeForm value={form} onChange={setForm} />

      <h2 className="page-title">Ingredients</h2>
      <IngredientEditor rows={rows} onChange={setRows} />

      {create.isError ? <ErrorBanner message={toFriendlyMessage(create.error)} /> : null}

      <div className="row">
        <Button variant="ghost" type="button" onClick={() => navigate('/recipes')}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={!canSave}>
          {create.isPending ? 'Saving…' : 'Save recipe'}
        </Button>
      </div>
    </form>
  );
}
