# Edge Functions (Phase 3)

All privileged / secret-key work lives here (Deno runtime). The frontend invokes
these with the user's JWT via `supabase.functions.invoke(...)`; secret keys
(`ANTHROPIC_API_KEY`, `STRIPE_*`) **never** leave the server.

These are the **secret-key features that ship LAST**. They are written and ready,
but each one returns a clean `503 { error: { code: "not_configured", … } }` until
a grown-up provisions its secret — so they can be deployed now without breaking.

| Function | Secret(s) needed | `verify_jwt` | Purpose |
|---|---|---|---|
| `glaze-suggest` | `ANTHROPIC_API_KEY` | true | Diagnose a test + suggest one change. Verifies ownership, requires `unlocked` + a credit, **atomically claims** a credit (refunds on failure), and is safety-bounded (never asserts chemistry/food-safety). Model: `claude-haiku-4-5`. |
| `create-checkout` | `STRIPE_SECRET_KEY` | true | Stripe Checkout for `unlock` / `topup` / `tip`. **Server sets the price** (never trusts the client). |
| `stripe-webhook` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | **false** | Applies paid results. **Signature-verified**, idempotent via `apply_stripe_payment` (unique `stripe_event_id`). The only writer of `plan`/`ai_credits`/`payments`. |
| `admin-overview` / `admin-users` / `admin-sales` | `OWNER_USER_ID` | true | Owner-only aggregates. Owner identity checked **server-side**; never via PostgREST. |

Shared code lives in `_shared/` (`http.ts` = CORS + normalized `{error:{code,message}}`; `supabase.ts` = service-role client + JWT/owner helpers). All functions: validate input, `try/catch`, normalized errors, no secrets/PII in logs or responses.

## Prerequisites (DB)

Apply migration `0010_billing_rpcs.sql` — it adds the atomic, service-role-only
RPCs the functions call: `claim_ai_credit`, `refund_ai_credit`, `apply_stripe_payment`.

## Set secrets (a grown-up, when activating each feature)

```bash
# AI Assistant
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Payments
supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SITE_URL=https://kilinkeep.vercel.app   # for checkout redirect URLs

# Owner admin (the owner's auth user id)
supabase secrets set OWNER_USER_ID=00000000-0000-0000-0000-000000000000
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically — do not set them. Never echo secret values into chat or git.

## Deploy

```bash
supabase functions deploy glaze-suggest
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook   # verify_jwt=false comes from config.toml
supabase functions deploy admin-overview
supabase functions deploy admin-users
supabase functions deploy admin-sales
```

Then in the Stripe dashboard, add a webhook endpoint pointing at the deployed
`stripe-webhook` URL for the `checkout.session.completed` event, and copy its
signing secret into `STRIPE_WEBHOOK_SECRET`.

## Frontend wiring (still pending)

The `assistant` / `billing` / `admin` pages are currently inert placeholders. The
last step (a small Phase 5 batch) is to add `features/*/services/*` that call
`supabase.functions.invoke('glaze-suggest' | 'create-checkout' | 'admin-*')` and
surface the `not_configured` 503 gracefully until secrets exist.
