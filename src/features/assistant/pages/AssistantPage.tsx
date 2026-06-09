// Assistant — asks the glaze-suggest Edge Function for a likely cause + one change.
// The model never asserts chemistry/food-safety (enforced server-side); this page
// always shows the "verify on a tile" framing and degrades gracefully when the
// feature isn't enabled / the user isn't unlocked / credits are exhausted.
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useTest } from '@/features/tests/hooks/useTest';
import { Button, Card, ErrorBanner, InfoBanner, Spinner } from '@/components/ui';
import { functionErrorInfo } from '@/lib/functions';
import { useGlazeSuggest } from '../hooks/useGlazeSuggest';

export function AssistantPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const isUnlocked = profile?.plan === 'unlocked';

  const testQuery = useTest(id);
  const suggest = useGlazeSuggest();

  const glazeName =
    testQuery.data?.recipe?.name ?? testQuery.data?.quick_glaze ?? 'this test';

  const err = suggest.error ? functionErrorInfo(suggest.error) : null;
  const notEnabled = err?.code === 'not_configured';
  const needsUnlock = err?.code === 'locked' || err?.code === 'no_credits';
  const otherError = err && !notEnabled && !needsUnlock ? err.message : null;

  return (
    <>
      <h1 className="page-title">Assistant</h1>

      <Card>
        <div className="muted small">Asking about</div>
        <div className="row spread">
          <strong>{glazeName}</strong>
          {id ? <Link to={`/tests/${id}`} className="small">View test</Link> : null}
        </div>
      </Card>

      <InfoBanner>
        <p>
          The Assistant suggests <strong>a likely cause</strong> and{' '}
          <strong>ONE change to try</strong> — then always asks you to{' '}
          <strong>verify on a tile</strong>.
        </p>
        <p className="small">
          It never states glaze chemistry or food-safety as fact. Treat every
          suggestion as a starting point for your own testing, not a guarantee.
        </p>
      </InfoBanner>

      {notEnabled ? (
        <InfoBanner>The Assistant isn’t enabled yet. Check back soon.</InfoBanner>
      ) : null}

      {(needsUnlock || !isUnlocked) && !notEnabled ? (
        <Card>
          <h3>{err?.code === 'no_credits' ? 'Out of AI suggestions' : 'Unlock to use the Assistant'}</h3>
          <p className="muted small">
            {err?.code === 'no_credits'
              ? 'Top up to get more Assistant suggestions.'
              : 'The Assistant is part of the one-time unlock — unlimited tests, charts, blends and export.'}
          </p>
          <Link to="/billing">
            <Button variant="primary" block>
              {err?.code === 'no_credits' ? 'Top up AI credits' : 'Unlock Kilnkeep'}
            </Button>
          </Link>
        </Card>
      ) : null}

      {otherError ? <ErrorBanner message={otherError} /> : null}

      {suggest.data ? (
        <Card>
          <p className="muted small">Likely cause</p>
          <p>{suggest.data.likely_cause}</p>
          <div className="divider" />
          <p className="muted small">Try this next</p>
          <p>{suggest.data.suggested_change}</p>
          <div className="divider" />
          <p className="small muted">Always verify the result on a test tile.</p>
        </Card>
      ) : null}

      <Card>
        {isUnlocked && typeof profile?.ai_credits === 'number' ? (
          <p className="muted small">{profile.ai_credits} AI suggestions left</p>
        ) : null}
        {suggest.isPending ? (
          <Spinner label="Reading your test…" />
        ) : (
          <Button
            variant="primary"
            block
            disabled={!id || !isUnlocked || notEnabled}
            onClick={() => id && suggest.mutate(id)}
          >
            {suggest.data ? 'Ask again' : 'Ask the Assistant'}
          </Button>
        )}
      </Card>
    </>
  );
}
