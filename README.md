# Kilnkeep

A glaze-testing notebook for potters, with an AI "diagnose & suggest" helper.

## What's in this folder
- `docs/`     - the plan (stack, money model, security, data model, roadmap, plus the full design set)
- `screens/`  - what each screen does (one file per screen)
- `mockups/`  - HTML mockups of every screen (open in a browser)
- `.gitignore` - keeps secrets and junk out of git
- `.env.example` - template for your keys (copy it to `.env.local`)

The React app code (src/, package.json, etc.) is created by Claude Code when you
start building - see `docs/roadmap.md`.

## Running it (after Claude Code sets up the app)
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL + anon key
3. `npm run dev`

Secrets live in `.env.local` (never committed). The Anthropic and Stripe keys
live in server settings only, never in the frontend.
