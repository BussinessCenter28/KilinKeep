# Testing strategy

Layered, matching the architecture. Keep tests close to the code they cover.

## 1. Unit tests (Vitest) — pure logic
- **What:** the batch-scaling math in `src/lib/recipeMath.ts` (percent → grams for a target
  batch weight, percent-total checks, optional firing-cost from kWh) and `src/lib/errors.ts`
  (message mapping).
- **Why:** the batch calculator must be exactly right — a wrong number wastes real materials.
- **Run:** `npm test`. Example: `src/lib/recipeMath.test.ts`.
- Pure functions have no I/O, so they're fast and deterministic.

## 2. Type checking — whole frontend
- `npm run typecheck` (also runs in `npm run build`). TypeScript catches a large class of
  bugs before runtime.

## 3. Database / RLS tests — Supabase
The real security boundary. Verify in the SQL editor by impersonating a user:
- A user can read/write **only their own** tests, recipes, and firings.
- A user **cannot** read another user's rows (returns nothing).
- A user **cannot** change `plan` or `ai_credits` on their profile.
- The 11th test for a free user is rejected.
- Signup auto-creates a `profiles` row.

## 4. Manual / end-to-end (before launch)
Once login/signup screens exist:
- Sign up → land on Tests → add a test (with photo) → see it in the list.
- Create a recipe; the batch calculator grams match hand-calculated values.
- Link a test to a parent ("what changed") → lineage strip shows the chain.
- Edit a test; delete a test (with undo).
- Settings: change default cone / units → new-test defaults update.
- Export downloads tests + photos.
- Log out → protected routes redirect to /login.

## 5. Edge Functions (when built, last)
- Input validation rejects bad payloads.
- `glaze-suggest`: requires auth, requires unlocked + credits, decrements one credit,
  **never** asserts chemistry/food-safety, always returns "verify on a tile."
- `stripe-webhook`: rejects bad signatures; is idempotent (same event twice = one credit grant).
- Admin functions: non-owner is denied.

## What we deliberately don't over-test
No heavy component snapshot tests for v1 — brittle and low-value. Focus testing on recipe
math and RLS, the two places a bug actually hurts (wasted materials, leaked data).
