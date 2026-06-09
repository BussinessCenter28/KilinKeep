// Billing — INERT placeholder. Stripe lives entirely in owner-verified Edge Functions
// (built last); the frontend never holds a Stripe key and never calls Stripe. Every
// purchase button here is DISABLED. This page only describes the offer. The plan shown
// is the SERVER's value (RLS), used as a display hint only.
import { useAuth } from '@/features/auth/AuthContext';
import { Button, Card, InfoBanner } from '@/components/ui';

const DISABLED_NOTE = 'Payments activate once Stripe is configured.';

export function BillingPage() {
  const { isUnlocked } = useAuth();

  return (
    <>
      <h1 className="page-title">Unlock Kilnkeep</h1>

      <InfoBanner>
        One-time, no subscription. Your data is yours — buying the unlock never locks
        anything you already saved.
      </InfoBanner>

      <Card>
        <div className="row spread">
          <h3>Unlock — $9.99</h3>
          <span className="tag">one-time</span>
        </div>
        <p className="muted small">
          Unlimited tests, the Assistant, charts, line blends and export. Pay once, keep
          it forever.
        </p>
        {isUnlocked ? (
          <p className="small">You already have the unlock. Thank you!</p>
        ) : null}
        <Button variant="primary" block disabled aria-disabled>
          Unlock for $9.99
        </Button>
      </Card>

      <Card>
        <h3>AI top-up — ~$1.99</h3>
        <p className="muted small">
          A bundle of extra Assistant credits when you have been busy testing. Optional,
          and never a subscription.
        </p>
        <Button block disabled aria-disabled>
          Add AI credits (~$1.99)
        </Button>
      </Card>

      <Card>
        <h3>Tip jar</h3>
        <p className="muted small">
          Like Kilnkeep? Leave a tip to support development. Totally optional.
        </p>
        <Button variant="ghost" block disabled aria-disabled>
          Leave a tip
        </Button>
      </Card>

      <p className="muted small" style={{ textAlign: 'center' }}>
        {DISABLED_NOTE}
      </p>
    </>
  );
}
