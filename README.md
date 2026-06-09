# Kilnkeep

A glaze-testing notebook for potters, with an AI "diagnose & suggest" helper.

## What's in this folder
- `src/`      - the React + Vite + TypeScript app (feature-based; see `docs/architecture.md` §D)
- `supabase/` - migrations (RLS on every table) + config; see `supabase/README.md`
- `docs/`     - the plan (stack, money model, security, data model, roadmap, plus the full design set)
- `screens/`  - what each screen does (one file per screen)
- `mockups/`  - HTML mockups of every screen (open in a browser)
- `.gitignore` - keeps secrets and junk out of git
- `.env.example` - template for your keys (copy it to `.env.local`)

The no-key core (auth, tests, recipes, firings, lineage, settings, export) is built.
The secret-key features (the AI Assistant, Stripe payments, owner admin) are inert
placeholders until a grown-up provisions the keys — by design, they come LAST.

## Running it
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL + anon key
3. Apply the database: `cd supabase && supabase db push` (or `supabase db reset` locally)
4. `npm run dev`

## Scripts
- `npm run dev` — start the dev server
- `npm run build` — typecheck + production build
- `npm run typecheck` — strict TypeScript, no emit
- `npm test` — unit tests (recipe math, error mapping)

Secrets live in `.env.local` (never committed). The Anthropic and Stripe keys
live in server settings only, never in the frontend.
