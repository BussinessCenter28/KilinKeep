// Recipe detail: header, ingredient list (toggle to edit + save), batch calculator, delete.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecipe, useRecipeMutations } from '../hooks/useRecipes';
import { IngredientEditor, type IngredientRow } from '../components/IngredientEditor';
import { BatchCalculator } from '../components/BatchCalculator';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Button, Card, ErrorBanner } from '@/components/ui';
import { toFriendlyMessage } from '@/lib/errors';
import type { RecipeWithIngredients } from '@/lib/types';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = id ?? '';
  const { data, isLoading, error } = useRecipe(recipeId);

  return (
    <QueryBoundary
      isLoading={isLoading}
      error={error}
      data={data}
      loadingLabel="Loading recipe…"
      isEmpty={(r) => r === null}
    >
      {(recipe) => <RecipeDetail recipe={recipe as RecipeWithIngredients} />}
    </QueryBoundary>
  );
}

function toRows(recipe: RecipeWithIngredients): IngredientRow[] {
  return recipe.recipe_ingredients.map((i) => ({ material: i.material, percent: String(i.percent) }));
}

function RecipeDetail({ recipe }: { recipe: RecipeWithIngredients }) {
  const navigate = useNavigate();
  const { saveIngredients, remove } = useRecipeMutations();

  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<IngredientRow[]>(() => toRows(recipe));

  const amounts = recipe.recipe_ingredients.map((i) => ({ material: i.material, percent: i.percent }));

  function startEdit() {
    setRows(toRows(recipe));
    setEditing(true);
  }

  function saveEdit() {
    const ingredients = rows
      .filter((r) => r.material.trim().length > 0)
      .map((r) => ({ material: r.material.trim(), percent: Number.parseFloat(r.percent) || 0 }));
    saveIngredients.mutate(
      { recipeId: recipe.id, ingredients },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleDelete() {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return;
    remove.mutate(recipe.id, { onSuccess: () => navigate('/recipes') });
  }

  return (
    <div>
      <div className="spread">
        <h1 className="page-title">{recipe.name}</h1>
        <span className="tag">{recipe.type}</span>
      </div>
      {recipe.cone ? <p className="muted">Cone {recipe.cone}</p> : null}
      {recipe.notes ? <p>{recipe.notes}</p> : null}

      <div className="divider" />

      <div className="spread">
        <h2 className="page-title">Ingredients</h2>
        {!editing ? (
          <Button variant="ghost" size="sm" type="button" onClick={startEdit}>
            Edit
          </Button>
        ) : null}
      </div>

      {editing ? (
        <>
          <IngredientEditor rows={rows} onChange={setRows} />
          {saveIngredients.isError ? <ErrorBanner message={toFriendlyMessage(saveIngredients.error)} /> : null}
          <div className="row">
            <Button variant="ghost" type="button" onClick={() => setEditing(false)} disabled={saveIngredients.isPending}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={saveEdit} disabled={saveIngredients.isPending}>
              {saveIngredients.isPending ? 'Saving…' : 'Save ingredients'}
            </Button>
          </div>
        </>
      ) : recipe.recipe_ingredients.length === 0 ? (
        <p className="muted">No ingredients yet.</p>
      ) : (
        <Card>
          <table className="batch-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {recipe.recipe_ingredients.map((i) => (
                <tr key={i.id}>
                  <td>{i.material}</td>
                  <td>{i.percent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="divider" />

      <h2 className="page-title">Batch calculator</h2>
      <BatchCalculator ingredients={amounts} />

      <div className="divider" />

      {remove.isError ? <ErrorBanner message={toFriendlyMessage(remove.error)} /> : null}
      <Button variant="danger" block type="button" onClick={handleDelete} disabled={remove.isPending}>
        {remove.isPending ? 'Deleting…' : 'Delete recipe'}
      </Button>
    </div>
  );
}
