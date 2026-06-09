// stripe-webhook — apply paid results. Deployed with verify_jwt = false (see
// config.toml): there is NO user JWT here. Authenticity is proven by verifying
// the Stripe signature against STRIPE_WEBHOOK_SECRET. Idempotent: apply_stripe_payment
// inserts the payments row (unique stripe_event_id) and grants entitlement in one
// transaction, so a replayed event is a no-op. Only this function (service role)
// writes plan / ai_credits / payments.
import Stripe from "npm:stripe@^17";
import { fail } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";

// What each purchase type grants. Prices live in create-checkout; this maps the
// outcome. unlock seeds 100 credits + flips plan; topup adds 100; tip records only.
const ENTITLEMENTS: Record<string, { credits: number; unlock: boolean }> = {
  unlock: { credits: 100, unlock: true },
  topup: { credits: 100, unlock: false },
  tip: { credits: 0, unlock: false },
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail("method_not_allowed", "Use POST.", 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return fail("not_configured", "Webhook not enabled.", 503);
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!signature) return fail("bad_request", "Missing signature.", 400);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(), // Deno needs the async/subtle provider
    );
  } catch {
    return fail("bad_signature", "Signature verification failed.", 400);
  }

  // We only act on completed checkouts; acknowledge everything else with 200.
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.user_id;
  const type = session.metadata?.type;
  const amount = (session.amount_total ?? 0) / 100;

  if (!userId || !type || !(type in ENTITLEMENTS)) {
    // Malformed metadata — ack so Stripe stops retrying, but do nothing.
    return new Response(JSON.stringify({ received: true, applied: false }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  const grant = ENTITLEMENTS[type]!;

  try {
    const admin = adminClient();
    const { error } = await admin.rpc("apply_stripe_payment", {
      p_event_id: event.id,
      p_user: userId,
      p_type: type,
      p_amount: amount,
      p_credits: grant.credits,
      p_unlock: grant.unlock,
    });
    if (error) throw error;
  } catch {
    // Let Stripe retry on a transient failure.
    return fail("apply_failed", "Could not apply payment.", 500);
  }

  return new Response(JSON.stringify({ received: true, applied: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
