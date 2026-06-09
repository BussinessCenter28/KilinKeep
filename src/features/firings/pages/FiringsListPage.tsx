// Firings list: cards link to detail, FAB to /firings/new. Loading/error/empty handled.
import { useNavigate, Link } from 'react-router-dom';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, EmptyState } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';
import type { Firing } from '@/lib/types';
import { useFirings } from '../hooks/useFirings';

export function FiringsListPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFirings();

  return (
    <>
      <h1 className="page-title">Firings</h1>

      <QueryBoundary<Firing[]>
        isLoading={isLoading}
        error={error}
        data={data}
        isEmpty={(firings) => firings.length === 0}
        loadingLabel="Loading firings…"
        empty={
          <EmptyState icon="🔥" title="No firings yet">
            Log a firing to track its schedule, cost, and results.
          </EmptyState>
        }
      >
        {(firings) => (
          <div>
            {firings.map((f) => (
              <Card key={f.id} onClick={() => navigate(`/firings/${f.id}`)}>
                <div className="spread">
                  <strong>{f.kiln ?? 'Firing'}</strong>
                  <span className="tag">{f.type}</span>
                </div>
                <div className="row wrap small muted">
                  <span>{formatDate(f.date)}</span>
                  {f.target_cone ? <span>Cone {f.target_cone}</span> : null}
                  {f.atmosphere ? <span>{f.atmosphere}</span> : null}
                  {f.cost != null ? <span>{formatMoney(f.cost)}</span> : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>

      <Link to="/firings/new" className="fab" aria-label="New firing">+</Link>
    </>
  );
}
