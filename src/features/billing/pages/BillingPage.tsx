// Billing — starts a Stripe Checkout via the create-checkout Edge Function (which
// holds the Stripe key and sets the price). The frontend never holds a Stripe key.
// Degrades gracefully when payments aren't configured yet.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button, Card, ErrorBanner, InfoBanner } from '@/components/ui';
import { functionErrorInfo } from '@/lib/functions';
import { useCheckout } from '../hooks/useCheckout';
import type { PurchaseType } from '../services/billingService';

export function BillingPage() {
  const { isUnlocked, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const purchase = params.get('purchase');
  const checkout = useCheckout();

  // After a successful return from Stripe, refresh the profile — the webhook may
  // have already applied the entitlement.
  useEffect(() => {
    if (purchase === 'success') void refreshProfile();
  }, [purchase, refreshProfile]);

  const err = checkout.error ? functionErrorInfo(checkout.error) : null;
  const notConfigured = err?.code === 'not_configured';
  const pendingType: PurchaseType | undefined = checkout.isPending ? checkout.variables : undefined;
  const disableAll = checkout.isPending || notConfigured;

  return (
    <>
      <h1 className="page-title">Unlock Kilnkeep</h1>

      {purchase === 'success' ? (
        <InfoBanner>Thanks! Your purchase is being applied — it’ll appear here shortly.</InfoBanner>
      ) : null}
      {purchase === 'cancelled' ? (
        <InfoBanner>Checkout cancelled — no charge was made.</InfoBanner>
      ) : null}
      {notConfigured ? <InfoBanner>Payments aren’t enabled yet. Check back soon.</InfoBanner> : null}
      {err && !notConfigured ? <ErrorBanner message={err.message} /> : null}

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
          Unlimited tests, the Assistant (~100 suggestions), charts, line blends and
          export. Pay once, keep it forever.
        </p>
        {isUnlocked ? (
          <p className="small">You already have the unlock. Thank you!</p>
        ) : (
          <Button
            variant="primary"
            block
            disabled={disableAll}
            onClick={() => checkout.mutate('unlock')}
          >
            {pendingType === 'unlock' ? 'Starting…' : 'Unlock for $9.99'}
          </Button>
        )}
      </Card>

      <Card>
        <h3>AI top-up — ~$1.99</h3>
        <p className="muted small">
          A bundle of ~100 extra Assistant suggestions. Optional, never a subscription.
        </p>
        <Button block disabled={disableAll || !isUnlocked} onClick={() => checkout.mutate('topup')}>
          {pendingType === 'topup' ? 'Starting…' : 'Add AI credits (~$1.99)'}
        </Button>
        {!isUnlocked ? <p className="hint">Unlock first to buy top-ups.</p> : null}
      </Card>

      <Card>
        <h3>Tip jar</h3>
        <p className="muted small">Like Kilnkeep? Leave a tip to support development.</p>
        <Button variant="ghost" block disabled={disableAll} onClick={() => checkout.mutate('tip')}>
          {pendingType === 'tip' ? 'Starting…' : 'Leave a tip'}
        </Button>
      </Card>
    </>
  );
}
