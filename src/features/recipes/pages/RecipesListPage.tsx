// Recipe list. Cards link to detail; FAB adds a new recipe. Loading/error/empty all
// handled by QueryBoundary.
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, EmptyState } from '@/components/ui';

export function RecipesListPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useRecipes();

  return (
    <div>
      <h1 className="page-title">Recipes</h1>

      <QueryBoundary
        isLoading={isLoading}
        error={error}
        data={data}
        loadingLabel="Loading recipes…"
        isEmpty={(rows) => rows.length === 0}
        empty={
          <EmptyState icon="🧪" title="No recipes yet">
            Add your first glaze or slip recipe.
          </EmptyState>
        }
      >
        {(rows) => (
          <div className="field-group">
            {rows.map((r) => (
              <Card key={r.id} onClick={() => navigate(`/recipes/${r.id}`)}>
                <div className="spread">
                  <strong>{r.name}</strong>
                  <span className="tag">{r.type}</span>
                </div>
                {r.cone ? <span className="muted small">Cone {r.cone}</span> : null}
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>

      <button className="fab" type="button" aria-label="New recipe" onClick={() => navigate('/recipes/new')}>
        +
      </button>
    </div>
  );
}
