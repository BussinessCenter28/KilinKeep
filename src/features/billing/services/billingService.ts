// Billing API. Calls create-checkout (which holds the Stripe key server-side and
// sets the price). Returns the Stripe-hosted Checkout URL to redirect to.
import { invokeFunction } from '@/lib/functions';

export type PurchaseType = 'unlock' | 'topup' | 'tip';

export async function startCheckout(type: PurchaseType): Promise<string> {
  const { checkout_url } = await invokeFunction<{ checkout_url: string }>('create-checkout', {
    type,
  });
  return checkout_url;
}
