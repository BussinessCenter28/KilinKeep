# Tech stack

- **GitHub** — code repository. Start private. Secrets are never committed; use `.gitignore`.
- **Vercel** — hosts the React frontend, auto-deploys from GitHub.
- **Supabase** — the backend:
  - Database (Postgres) for recipes, tests, firings
  - Auth (user logins)
  - Storage (kilnkeep photos)
  - Edge Functions (safe server-side calls to Anthropic + Stripe)
  - Row Level Security (each user only sees their own data)
- **React + Vite (TypeScript)** frontend. Mobile-first PWA, offline-friendly logging
  (studios have poor wifi).
- **Anthropic API (Claude)** — powers the single AI feature, "diagnose & suggest next."
  Called ONLY from a server (Edge) function; the key stays secret.
- **Stripe** — one-time $9.99 unlock + AI top-ups. Handled server-side.

All secret keys live in Vercel / Supabase environment settings — never in the browser
and never in git.

## The one AI feature
`glaze-suggest`: given a test's recipe + firing conditions + result, return a likely
cause and exactly one suggested change. It never states chemistry/food-safety as fact
and always says "verify on a tile." One AI feature only — not an "AI everything" app.
