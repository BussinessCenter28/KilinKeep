# Engineering mandate (governing)

This is the binding engineering mandate for **Kilnkeep**. All work follows it.
It refines (does not replace) `security.md`, `stack.md`, and `data-model.md`.

## What Kilnkeep is
A glaze-testing notebook for potters who actively develop and dial in glazes: log a
test tile, link *what changed* to *what came out of the kiln*, and get one AI nudge on
what to try next. Wedge, scope, and money model live in `money-model.md` and the brief.

## Non-negotiables
- **Frontend is untrusted.** It uses supabase-js with the **anon key only**, never
  performs privileged operations, never holds a service-role or any secret key.
- **RLS-first.** Every table has Row Level Security ON with explicit SELECT / INSERT /
  UPDATE / DELETE policies referencing `auth.uid()`. A table with no policy is invalid
  design.
- **Edge Functions for everything privileged:** third-party APIs (Anthropic, Stripe,
  email), secret keys, elevated permissions, sensitive business logic.
- **Service-role key only inside Edge Functions / secure env.** Never shipped to the
  browser, never in git.
- **A grown-up owns every real key.** We PAUSE before building anything that needs one
  (Anthropic, Stripe, owner id).

## Safety (app-specific, non-negotiable)
- The AI **never** states glaze chemistry or food-safety as fact, and never guarantees a
  result. It offers a likely cause and **one** suggested change, always paired with
  "verify on a tile." Food-safety/leaching is a real health matter — the app must tell
  users to confirm food-safety independently, never assert it.
- No scraping any site (including Glazy). Users paste/own their recipes.

## Code quality
- Feature-based structure; no business logic in UI components.
- Business logic isolated in `services/`, `hooks/`, or Edge Functions.
- Files kept under ~300–400 lines.
- Loading / error / empty states at every layer; normalized error format; no raw DB
  errors surfaced to the UI; no sensitive data in logs.

## Performance
- Pagination for all large lists (keyset, not OFFSET); indexes on every filtered column;
  avoid N+1.

## Phased delivery (stop for approval after each phase)
1. Architecture design (no code) + security/RLS strategy
2. Database schema + migrations + RLS policies
3. Edge Functions design + implementation
4. Frontend scaffold (React + Supabase client)
5. Feature-by-feature implementation (5–10 files per batch)
6. Testing strategy + security review checklist
7. Deployment (Vercel + Supabase + env management)

After each phase: stop, wait for approval, give a risk/security review.
