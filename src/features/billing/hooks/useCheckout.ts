// Mutation: start a Stripe Checkout session and redirect the browser to it.
import { useMutation } from '@tanstack/react-query';
import { startCheckout, type PurchaseType } from '../services/billingService';

export function useCheckout() {
  return useMutation({
    mutationFn: (type: PurchaseType) => startCheckout(type),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}
