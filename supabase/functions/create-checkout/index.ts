// create-checkout — start a Stripe Checkout session for the one-time unlock, an
// AI top-up, or a tip. The SERVER sets the price (never trusts a client amount)
// and attaches the user id + purchase type as metadata for the webhook.
import Stripe from "npm:stripe@^17";
import { handlePreflight, ok, fail } from "../_shared/http.ts";
import { adminClient, getCaller } from "../_shared/supabase.ts";

// Server-authoritative prices (USD cents). The client only names the TYPE.
const PRICES: Record<string, { amount: number; label: string }> = {
  unlock: { amount: 999, label: "Kilnkeep — unlock everything" },
  topup: { amount: 199, label: "Kilnkeep — 100 AI suggestions" },
  tip: { amount: 500, label: "Kilnkeep — tip jar" },
};

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return fail("method_not_allowed", "Use POST.", 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return fail("not_configured", "Payments aren’t enabled yet.", 503);

  let admin;
  try {
    admin = adminClient();
  } catch {
    return fail("server_error", "Server is misconfigured.", 500);
  }

  const caller = await getCaller(req, admin);
  if (!caller) return fail("unauthorized", "Please sign in.", 401);

  let type: unknown;
  try {
    ({ type } = await req.json());
  } catch {
    return fail("bad_request", "Invalid JSON body.", 400);
  }
  if (typeof type !== "string" || !(type in PRICES)) {
    return fail("bad_request", "Unknown purchase type.", 400);
  }
  const price = PRICES[type]!;

  const siteUrl = Deno.env.get("SITE_URL") ?? req.headers.get("origin") ?? "";
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: price.amount,
          product_data: { name: price.label },
        },
      }],
      // The webhook reads these to apply the result to the right user.
      metadata: { user_id: caller.id, type },
      success_url: `${siteUrl}/settings?purchase=success`,
      cancel_url: `${siteUrl}/settings?purchase=cancelled`,
    });
    if (!session.url) throw new Error("no checkout url");
    return ok({ checkout_url: session.url });
  } catch (_e) {
    return fail("checkout_failed", "Could not start checkout. Please try again.", 502);
  }
});
