// Full test detail: glaze source, fired-with facts, rating + tags, notes, photo
// gallery, add-photo, lineage strip, and Assistant / Edit / Delete actions.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { TestWithRelations } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/features/auth/AuthContext';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Button, Card, ErrorBanner, Stars } from '@/components/ui';
import { toFriendlyMessage } from '@/lib/errors';
import { useTest } from '../hooks/useTest';
import { useTestLineage } from '../hooks/useTestLineage';
import { useTestMutations } from '../hooks/useTestMutations';
import { useTestPhotos } from '../hooks/useTestPhotos';
import { LineageStrip } from '../components/LineageStrip';
import { PhotoGallery } from '../components/PhotoGallery';
import { PhotoPicker } from '../components/PhotoPicker';

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="spread">
      <span className="muted small">{label}</span>
      <span className="small">{value}</span>
    </div>
  );
}

function DetailBody({ test, id }: { test: TestWithRelations; id: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const lineage = useTestLineage(id);
  const { remove } = useTestMutations();
  const photos = useTestPhotos(id);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const title = test.quick_glaze?.trim() || test.recipe?.name?.trim() || 'Untitled test';
  const firingLabel = test.firing
    ? [test.firing.kiln ?? 'Firing', test.firing.target_cone ? `cone ${test.firing.target_cone}` : null]
        .filter(Boolean)
        .join(' · ')
    : null;

  const onDelete = async () => {
    setActionError(null);
    try {
      await remove.mutateAsync(id);
      navigate('/', { replace: true });
    } catch (e) {
      setActionError(toFriendlyMessage(e));
    }
  };

  return (
    <>
      <div className="spread">
        <h1 className="page-title">{title}</h1>
        <Stars rating={test.result_rating} />
      </div>

      {actionError ? <ErrorBanner message={actionError} /> : null}

      <Card>
        <Fact label="Glaze" value={test.quick_glaze ?? test.recipe?.name} />
        {test.recipe ? (
          <div className="spread">
            <span className="muted small">Recipe</span>
            <Link className="small" to={`/recipes/${test.recipe.id}`}>
              View recipe
            </Link>
          </div>
        ) : null}
        <Fact label="Clay body" value={test.clay_body} />
        <Fact label="Cone" value={test.cone} />
        <Fact label="Application" value={test.application} />
        <Fact label="Atmosphere" value={test.atmosphere} />
        <Fact label="Firing" value={firingLabel} />
        <Fact label="Logged" value={formatDate(test.created_at)} />
        {test.change_note ? <Fact label="Change" value={test.change_note} /> : null}
      </Card>

      {test.result_tags.length > 0 ? (
        <div className="row wrap">
          {test.result_tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {test.notes ? (
        <Card>
          <div className="muted small">Notes</div>
          <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{test.notes}</p>
        </Card>
      ) : null}

      <div className="divider" />
      <h2 className="small muted">Photos</h2>
      <PhotoGallery photos={test.test_photos} onRemove={(p) => photos.remove.mutate(p)} removing={photos.remove.isPending} />
      {user ? (
        <PhotoPicker
          uploading={photos.add.isPending}
          onUpload={({ file, kind, isCover }) =>
            photos.add.mutateAsync({ testId: id, userId: user.id, file, kind, isCover })
          }
        />
      ) : null}

      {lineage.data && (lineage.data.ancestors.length > 0 || lineage.data.children.length > 0) ? (
        <>
          <div className="divider" />
          <h2 className="small muted">Lineage</h2>
          <LineageStrip
            ancestors={lineage.data.ancestors}
            current={lineage.data.current}
            children={lineage.data.children}
          />
        </>
      ) : null}

      <div className="divider" />
      <Button block variant="primary" onClick={() => navigate(`/tests/${id}/assistant`)}>
        Ask the Assistant
      </Button>
      <div className="row" style={{ marginTop: 10 }}>
        <Button variant="ghost" block onClick={() => navigate(`/tests/${id}/edit`)}>
          Edit
        </Button>
        {confirming ? (
          <Button variant="danger" block onClick={() => void onDelete()} disabled={remove.isPending}>
            {remove.isPending ? 'Deleting…' : 'Confirm delete'}
          </Button>
        ) : (
          <Button variant="danger" block onClick={() => setConfirming(true)}>
            Delete
          </Button>
        )}
      </div>
      {confirming && !remove.isPending ? (
        <Button variant="ghost" block onClick={() => setConfirming(false)} className="small">
          Cancel
        </Button>
      ) : null}
    </>
  );
}

export function TestDetailPage() {
  const { id } = useParams();
  const query = useTest(id);

  return (
    <QueryBoundary
      isLoading={query.isLoading}
      error={query.error}
      data={query.data}
      isEmpty={(d) => d === null}
      loadingLabel="Loading test…"
    >
      {(test) => (test && id ? <DetailBody test={test} id={id} /> : <ErrorBanner message="Test not found." />)}
    </QueryBoundary>
  );
}
