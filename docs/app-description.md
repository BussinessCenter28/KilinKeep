# Kilnkeep — App description

## App description
Kilnkeep is a mobile-first web app (PWA) that acts as a glaze-testing notebook for potters who
actively develop and dial in their glazes. A potter logs a **test tile** — the glaze/recipe,
application (coats, dip, brush, spray), clay body, cone, atmosphere, and the firing it went
through — adds a photo of the fired result, and rates and tags how it came out. The thing that
makes it different from the dozen general "pottery trackers" is the **testing loop**: each test
can link to a previous "parent" test with a one-line note of the single thing that changed,
building a visible lineage so the potter can see exactly which variable produced which result.
One AI feature, the **Assistant**, reads a test's recipe + firing conditions + result and returns
a likely cause plus exactly one change to try next — it never states glaze chemistry or
food-safety as fact and always ends with "verify on a tile." Free for the first 10 tests; a
one-time **$9.99 unlock** (no subscription) removes the limit and turns on the Assistant, charts,
the blend helper, and full export. Stack: React + Vite + TypeScript · Supabase (Auth, Postgres
with RLS, Storage, Edge Functions) · Vercel · Anthropic (the single AI feature) · Stripe.

## Core features
- **Test-tile log** — capture a test in under a minute: photo, glaze, application, clay body,
  cone, atmosphere, firing link, result rating + tags, notes. Big tap targets for messy hands.
- **Variable diffing / lineage** — link a test to its parent + a one-line "what changed"; a
  lineage strip shows the chain (parent -> this -> children). This is the core wedge.
- **Glaze recipe library** — recipes with an ingredients table (material + percent, warns if not
  ~100%) and a **batch calculator** (target grams -> grams per material).
- **Firing log** — kiln runs with date, type (bisque/glaze), target cone, atmosphere, optional
  ramp schedule and cost; tests link to the firing they were in.
- **Photo documentation** — before/after photos per test, stored privately (signed URLs).
- **Search & filter** — by cone, glaze, result, or clay body.
- **AI Assistant (glaze-suggest)** — ONE AI feature: diagnose a result + suggest one change.
  Server-side only (secret key never in the browser); safety-bounded (never asserts food-safety).
- **Charts & insights** (unlocked) — results over time, by glaze, by cone.
- **Line/triaxial blend helper** (phase 2) — generate a structured set of test variations.
- **Export everything** — download all tests, recipes, and photos. Your data is yours.
- **One-time unlock + AI top-ups + tip jar** — $9.99 once; ~$1.99 / 100 extra AI suggestions;
  optional "buy me a coffee." No subscription.
- **Accounts & privacy** — email + password (Supabase Auth); per-user data isolation via RLS.
- **Owner-only admin** — overview, users, and sales dashboards, verified on the server.

## User types / roles
- **Visitor (not signed in)** — can only reach the auth screens (log in / sign up / reset). RLS
  denies all app data; protected routes redirect to log in.
- **Free user** — signed in; can log up to 10 test tiles, plus unlimited recipes and firings;
  no AI Assistant; can still export their data. Free cap enforced by a DB trigger, not just the UI.
- **Unlocked user (paid, one-time $9.99)** — everything Free has, with no test limit, plus the
  AI Assistant (includes ~100 suggestions, top-up for more), charts, and the blend helper.
- **Owner / admin (single, server-verified)** — the app owner only. Identity checked server-side
  against an `OWNER_USER_ID` secret inside Edge Functions (never via PostgREST). Sees read-only
  aggregate dashboards (overview / users / sales); cannot see another user's private content.
