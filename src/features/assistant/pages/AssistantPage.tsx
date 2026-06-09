// Assistant — INERT placeholder. The real Assistant runs behind an owner-configured
// Anthropic key inside an Edge Function (built last). This page makes ZERO network
// calls: no Edge Function, no external API. It only explains what the Assistant will
// do and gates the CTA on the server-provided plan (display hint only; RLS/the
// Edge Function enforce real authorization later).
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button, Card, InfoBanner } from '@/components/ui';

export function AssistantPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const isFree = profile?.plan === 'free';

  return (
    <>
      <h1 className="page-title">Assistant</h1>

      <Card>
        <div className="muted small">Asking about test</div>
        <div className="row spread">
          <code className="small">{id ?? 'unknown test'}</code>
          {id ? (
            <Link to={`/tests/${id}`} className="small">View test</Link>
          ) : null}
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
        <p className="small">
          It activates once the owner configures the Anthropic key. Until then this
          screen is a preview and makes no requests.
        </p>
      </InfoBanner>

      {isFree ? (
        <Card>
          <h3>Unlock to use the Assistant</h3>
          <p className="muted small">
            The Assistant is part of the one-time unlock, along with unlimited tests,
            charts, blends and export.
          </p>
          <Link to="/billing">
            <Button variant="primary" block>Unlock to use the Assistant</Button>
          </Link>
        </Card>
      ) : null}

      <Card>
        <p className="muted small">
          {isFree
            ? 'Unlock the Assistant to ask questions about this test.'
            : 'The Assistant is not yet active — it turns on once the owner configures the Anthropic key.'}
        </p>
        <Button variant="primary" block disabled aria-disabled>
          Ask
        </Button>
      </Card>
    </>
  );
}
