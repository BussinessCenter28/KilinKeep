# Deployment (Vercel + Supabase)

The frontend deploys to **Vercel** (auto-builds from GitHub). The backend is the
**Supabase** project. Secret-key pieces (AI, Stripe) come last and are set up by a grown-up.

## Where every key lives (env management)

| Value | Where it goes | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel env + local `.env.local` | No (public) |
| `VITE_SUPABASE_ANON_KEY` | Vercel env + local `.env.local` | No (public, RLS-protected) |
| `ANTHROPIC_API_KEY` | Supabase Edge Function secrets only | **Yes** — grown-up, later |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Supabase Edge Function secrets only | **Yes** — grown-up, later |
| `OWNER_USER_ID` | Supabase Edge Function secrets only | Sensitive — later |

Never put a secret key in Vercel's *frontend* build env or in git.

## 1. Database (Supabase)
1. Apply the migrations in order (see `supabase/README.md`).
2. **Auth → URL Configuration:** set **Site URL** to your Vercel domain
   (e.g. `https://kilnkeep.vercel.app`) and add it to the redirect allow-list, so
   confirmation / password-reset emails link back to the live app.
3. Create the private Storage bucket `test-photos` with per-user-folder RLS.

## 2. Frontend (Vercel)
1. vercel.com → **Add New → Project** → import `<github-user>/kilnkeep`.
2. Framework preset: **Vite**. Build: `npm run build`. Output dir: `dist`.
3. **Environment Variables** → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (the same public values as `.env.local`).
4. Deploy. `vercel.json` rewrites all routes to `index.html` so client-side routes
   (e.g. `/test/123`) work on refresh.
5. (Optional) add a custom domain (e.g. `kilnkeep.app`).

## 3. Secret-key features (LAST, grown-up)
When we build them:
- Deploy Edge Functions and set secrets:
  `supabase secrets set ANTHROPIC_API_KEY=... STRIPE_SECRET_KEY=...`
  (or via the dashboard). Never echo these into chat or git.
- Configure the Stripe webhook endpoint to the deployed `stripe-webhook` function and set
  `STRIPE_WEBHOOK_SECRET`.

## Pre-launch
Run `npm run typecheck`, `npm test`, and the `security-checklist.md` pass. Confirm a
privacy policy is in place (roadmap step 7).
