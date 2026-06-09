# Security review checklist

Run through this before each launch and after any change touching auth, data, or keys.
Mirrors `mandate.md` + `security.md`.

## Secrets
- [ ] No secret keys in the frontend or git (only `VITE_SUPABASE_URL` +
      `VITE_SUPABASE_ANON_KEY`, both public/safe).
- [ ] `.env.local` is gitignored; only `.env.example` is committed.
- [ ] Anthropic / Stripe keys live ONLY in Edge Function / host env (added by a grown-up).
- [ ] Service-role key never shipped to the browser.

## Database / RLS
- [ ] RLS enabled on every table (`profiles`, `recipes`, `recipe_ingredients`, `firings`,
      `tests`, `test_photos`, `payments`).
- [ ] Each table has explicit SELECT/INSERT/UPDATE/DELETE policies on `auth.uid()`.
- [ ] A user cannot read or write another user's rows (tested by impersonation).
- [ ] Users cannot edit `plan` / `ai_credits` (column grants).
- [ ] Free 10-test cap enforced by a DB trigger, not just the UI.
- [ ] Storage: `test-photos` is private; users access only their own folder; reads via
      signed URLs.

## Frontend
- [ ] Anon key only; all data access goes through `lib`/services, never raw in components.
- [ ] Protected routes gated by `RequireAuth`; owner area never trusts client state.
- [ ] No secrets in `localStorage`; Supabase manages the session token.
- [ ] User input validated before sending (and again by RLS/Edge Functions).
- [ ] Errors shown via `toFriendlyMessage` — no raw DB errors leak to the UI.

## Edge Functions (when built)
- [ ] Verify the caller's JWT; for admin, verify `OWNER_USER_ID` server-side.
- [ ] Validate all inputs; never trust client-sent ownership.
- [ ] `stripe-webhook` verifies the signature and is idempotent.
- [ ] try/catch everywhere; normalized error shape; no secrets/PII in logs.
- [ ] `glaze-suggest` requires unlocked + credits, decrements credits, and **never** states
      glaze chemistry or food-safety as fact; output always includes "verify on a tile."

## App behaviour
- [ ] No scraping; no auto-sharing to communities; the user shares results themselves.
- [ ] AI never claims a glaze is food-safe; tells users to confirm food-safety independently.
- [ ] Content is honest and age-appropriate.
- [ ] Privacy policy present before launch; only email + password collected.
- [ ] "Export my data" works (JSON + photos) — your-data-is-yours is part of the pitch.

## Dependencies
- [ ] `npm audit` reviewed; no high/critical advisories in shipped code.
