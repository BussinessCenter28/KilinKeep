# Kilnkeep architecture — Phase 1 (design only)

Governed by `mandate.md`. No application code here — this is the design that Phases 2–7
implement. Stack: React + Vite (TypeScript) · Supabase (Postgres + Auth + Storage + Edge
Functions) · Anthropic (Claude) · Stripe · Vercel.

---

## A. System architecture

### Components & trust boundaries

```
                          UNTRUSTED                 │            TRUSTED (server)
                                                    │
  ┌──────────────────────────────────────────┐     │
  │  Browser  —  React + Vite SPA (Vercel)    │     │
  │  • supabase-js with ANON KEY only         │     │
  │  • no secrets, no service role            │     │
  └───────────────┬───────────────┬───────────┘    │
                  │               │                 │
        (1) JWT'd │       (3) JWT'd invoke          │
        PostgREST │               │                 │
                  ▼               ▼                 │
        ┌───────────────┐  ┌───────────────────────┴──────────────┐
        │  Supabase API │  │  Supabase Edge Functions (Deno)       │
        │  (PostgREST)  │  │  • hold SECRET keys (env only)        │
        │  RLS ENFORCED │  │  • verify caller JWT / owner          │
        └──────┬────────┘  │  • use service-role for privileged db │
               │           └───┬───────────┬───────────┬──────────┘
               │               │           │           │
               ▼               ▼           ▼           ▼
        ┌──────────────┐  ┌─────────┐ ┌─────────┐ ┌──────────────┐
        │  Postgres    │  │Anthropic│ │ Stripe  │ │ Supabase     │
        │  (RLS on all │  │  API    │ │  API    │ │ Storage      │
        │   tables)    │  └─────────┘ └─────────┘ │ (test-photos)│
        └──────────────┘                          └──────────────┘
```

### Data flows

**(1) Authenticated data request (read/write own tests/recipes/firings)**
Browser → supabase-js (user JWT) → PostgREST → Postgres. **RLS** filters every row to
`auth.uid()`. The frontend cannot widen this; even a tampered client only ever sees its
own rows.

**(2) Unauthenticated request (visitor)**
No JWT. RLS denies all app tables. Visitor can only reach Auth endpoints
(sign-up / sign-in / reset). App routes are guarded by an auth gate that redirects to
Log in.

**(3) Edge Function call (AI, payments, admin)**
Browser → `supabase.functions.invoke(fn, body)` with the user JWT → Edge Function. The
function validates input, verifies the JWT (and owner identity for admin), calls the
third-party API with a **secret key that never leaves the server**, performs privileged
DB writes with the **service-role** client, returns a normalized response.

**(4) Stripe webhook (server→server)**
Stripe → `stripe-webhook` Edge Function. No user JWT; authenticity is proven by **Stripe
signature verification** (`STRIPE_WEBHOOK_SECRET`). Only this function flips
`plan`/`ai_credits` and inserts `payments` rows.

### Security model overview
- **Identity:** Supabase Auth (email + password). JWT carries `sub` = `auth.uid()`.
- **Authorization:** RLS for all per-user data; Edge Functions for privileged ops;
  owner-only admin checked **server-side** against an `OWNER_USER_ID` secret.
- **Secrets:** live only in Edge Function env / Vercel env. Frontend has anon key only.
  `.env.local` gitignored; only `.env.example` committed.
- **Integrity of the money model:** `plan` and `ai_credits` are **not** user-writable
  (column grants); the free test cap is enforced by a DB trigger; the AI never asserts
  chemistry or food-safety.

---

## B. Database design (design level — SQL lands in Phase 2)

All tables: RLS ON. `user_id` columns reference `auth.users(id) on delete cascade`.
All tables carry `created_at` **and `updated_at`** (a shared touch trigger maintains
`updated_at`).

### Cross-tenant FK rule (CRITICAL — applies to every FK below)
RLS `WITH CHECK (user_id = auth.uid())` proves the *new* row is mine; it does **not**
prove a referenced row is mine — a plain FK only proves the target exists. Without a
guard a client could attach another user's recipe/firing/parent-test and leak its
existence via the lineage strip. This is the one place RLS-by-`user_id` alone silently
fails. Enforcement splits by delete semantics (a composite FK including `user_id` cannot
use `ON DELETE SET NULL` — it would null `user_id` too):

- **Child-dies-with-parent (cascade):** `recipe_ingredients.(recipe_id, user_id)` →
  `recipes(id, user_id)` and `test_photos.(test_id, user_id)` → `tests(id, user_id)`,
  both **composite FK `ON DELETE CASCADE`**. Same-owner is structurally guaranteed.
- **Optional link that outlives the parent:** `tests.recipe_id` / `firing_id` /
  `parent_test_id` use a **single-column FK `ON DELETE SET NULL` + a `tests_validate_refs`
  `BEFORE INSERT/UPDATE` trigger** asserting the referenced row shares `user_id`.

Composite FKs require `UNIQUE (id, user_id)` on each parent table. Deleting a recipe that
a test references backfills the test's `quick_glaze` from the recipe name (a
`BEFORE DELETE` trigger) so the "exactly one glaze source" rule still holds.

### `profiles` — one row per user
- **Columns:** `user_id` (PK), `plan` (`free`|`unlocked`, default `free`),
  `ai_credits` int (default 0), `default_cone` text (default `cone 6`), `units` text
  (default `g`), `created_at`.
- **Constraints:** `plan in ('free','unlocked')`.
- **RLS:** SELECT/UPDATE own row. No user INSERT (an `on_auth_user_created` trigger on
  `auth.users`, SECURITY DEFINER with `SET search_path = ''`, creates it on signup).
  No DELETE.
- **Column guard:** `revoke update … ; grant update (default_cone, units)` so users can't
  self-upgrade `plan` or grant themselves AI credits. **Only the `stripe-webhook`
  (service-role) writes `plan`/`ai_credits`** — unlock seeds `ai_credits += 100`, each
  top-up `+= 100`. AI is credit-metered even for unlocked users (see money model).
- **Relationships:** 1–1 with `auth.users`; 1–many to recipes, firings, tests, payments.

### `recipes` + `recipe_ingredients`
- `recipes`: `id` PK, `user_id`, `name`, `type` (glaze|slip|underglaze|engobe), `cone`,
  `notes`, `created_at`. Index `(user_id, name)`.
- `recipe_ingredients`: `id` PK, `user_id`, `recipe_id` FK, `material`, `percent`. Percent
  total validated in UI (warn if ≠ ~100); not DB-enforced.
- **RLS:** own rows only, all verbs.

### `firings`
- **Columns:** `id` PK, `user_id`, `kiln` text, `date`, `type` (bisque|glaze|other),
  `target_cone`, `atmosphere` (oxidation|reduction), `schedule` jsonb, `cost` numeric
  (nullable), `notes`, `created_at`. Index `(user_id, date desc)`.
- **RLS:** own rows only, all verbs.

### `tests` — the core object
- **Columns:** `id` PK, `user_id` (default `auth.uid()`), `recipe_id` FK (nullable),
  `quick_glaze` text (nullable), `parent_test_id` FK→tests (nullable), `change_note` text,
  `clay_body` text, `firing_id` FK (nullable), `cone`, `atmosphere`, `application`,
  `result_rating` int, `result_tags` text[], `notes`, `created_at`.
- **Indexes:** `(user_id, created_at desc)` for the list; `(parent_test_id)` for lineage.
- **Constraints:** `result_rating` CHECK 1–5; `atmosphere`/`application` CHECK against
  their allowed sets; exactly one of `recipe_id` / `quick_glaze` present.
- **RLS:** SELECT/INSERT/UPDATE/DELETE own rows.
- **Business rule (trigger):** BEFORE INSERT — if `plan = 'free'` and the user already has
  ≥ 10 tests, raise a friendly error. The count + insert race is closed with a per-user
  `pg_advisory_xact_lock(hashtext(user_id::text))` so two concurrent inserts can't both
  pass at 9. SECURITY DEFINER with `SET search_path = ''` (schema-qualified). (Frontend
  also shows the limit, but the DB is the source of truth.)

### `test_photos`
- **Columns:** `id` PK, `user_id`, `test_id` FK, `storage_path`, `is_cover` bool,
  `kind` (before|after).
- **Constraints:** partial unique index `(test_id) WHERE is_cover` — at most one cover
  per test.
- **RLS:** own rows only.

### `payments` — billing history (Stripe, later)
- **Columns:** `id` PK, `user_id`, `type` (`unlock`|`topup`|`tip`), `amount`,
  `stripe_event_id` (unique — idempotency), `created_at`.
- **RLS:** SELECT own rows only. **No** user INSERT/UPDATE/DELETE — only the webhook
  (service-role) writes here.

### Owner / admin
Single owner. The owner's `auth.uid()` is stored as the `OWNER_USER_ID` **Edge Function
secret**. Admin dashboards never query tables directly (RLS would scope them to the
owner's own rows); instead admin Edge Functions verify `caller == OWNER_USER_ID` and
aggregate with the service-role client.

### Storage
Private bucket **`test-photos`**, objects pathed `"{user_id}/{test_id}/{uuid}.{ext}"`.
storage.objects RLS: a user may read/write/delete only files whose first path segment
equals their `auth.uid()`. Reads use **signed URLs** (private bucket) so photos aren't
world-readable.

### Pagination
Test/recipe/firing lists use keyset pagination on `(created_at, id)`, not large `OFFSET`s.

---

## C. Edge Function design (implemented in Phase 3 — needs grown-up keys)

| Function | Purpose | Input → Output | Secrets | Security boundary |
|---|---|---|---|---|
| `glaze-suggest` | Diagnose a result + suggest one change | `{test_id}` → `{likely_cause, suggested_change}` | `ANTHROPIC_API_KEY` | Verify JWT; load test+recipe+firing via service-role & confirm ownership; require `plan=unlocked` & `ai_credits>0`; **atomically** claim one credit (`UPDATE … SET ai_credits = ai_credits - 1 WHERE user_id = … AND ai_credits > 0 RETURNING`) and **refund on Anthropic failure** — never burn a paid credit on an error; prompt forbids asserting chemistry/food-safety and requires "verify on a tile." |
| `create-checkout` | Stripe Checkout for unlock / topup / tip | `{type}` → `{checkout_url}` | `STRIPE_SECRET_KEY` | Verify JWT; server sets the price (never trusts a client amount); attaches `user_id` as metadata. |
| `stripe-webhook` | Apply paid results | Stripe event → `200/4xx` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | **Signature-verified**; deployed with `verify_jwt = false` (no user JWT — auth is the Stripe signature); idempotent via `stripe_event_id`; service-role sets `plan`/`ai_credits`, inserts `payments`. |
| `admin-overview` / `admin-users` / `admin-sales` | Owner dashboards | `{paging?}` → aggregates | (service-role) | Verify JWT **and** `caller == OWNER_USER_ID`; deny otherwise; read-only aggregates. |

All functions: validate inputs, `try/catch`, return `{ error: { code, message } }`
(no raw DB errors), never log keys or PII.

**PAUSE points:** `glaze-suggest` (Anthropic key), all Stripe functions (Stripe keys),
admin functions (`OWNER_USER_ID`). Built only after a grown-up adds keys.

**Build order (decided & confirmed): every secret-key feature is LAST.** That means the
**paid flows (all Stripe) and ALL API keys** — `glaze-suggest` (Anthropic), `create-checkout`
+ `stripe-webhook` (Stripe), and the admin functions (`OWNER_USER_ID`) — are built only
after a grown-up provisions the keys. The no-key core ships first: tests, recipes,
firings, lineage, photos, search/filter, settings, export, auth. Until the keys exist the
`payments` table and `plan`/`ai_credits` columns still exist, and a user can be flipped to
`unlocked` (with seed credits) manually via the service-role for testing — the gating
exists now; only the key-dependent paths are deferred.

---

## D. Frontend architecture (scaffold in Phase 4, features in Phase 5)

### Feature-based structure
```
src/
  app/            router, providers, route guards (RequireAuth, RequireOwner)
  lib/
    supabase.ts   anon client
    recipeMath.ts pure batch-scaling / percent-total math (no I/O — unit tested)
    types.ts      shared DB/domain types
    errors.ts     normalize Supabase/function errors → friendly messages
  features/
    auth/         components/ hooks/useAuth services/authService
    tests/        list (Home), New Test, Test detail, lineage strip; hooks/ services/
    recipes/      list, detail + batch calculator; hooks/ services/
    firings/      list, detail; hooks/ services/
    assistant/    glaze-suggest UI + hooks/useGlazeSuggest (calls edge fn)
    settings/     default cone, units, export, unlock; services/profileService
    billing/      unlock / topup / tip (calls create-checkout)
    admin/        owner-only dashboards (calls admin-* fns)
  components/     shared presentational UI (Button, Card, Field, EmptyState, PhotoPicker…)
```

### Layering rule
UI components are presentational. All Supabase/Edge calls live in
`features/*/services/*` (the API abstraction layer). Hooks hold stateful logic and call
services. No `supabase` import inside a component.

### State strategy
- **Local state first** (`useState`) for UI.
- **AuthContext** for the session + profile (small, justified — needed app-wide).
- **Server state** via **TanStack Query** — caching, pagination, loading/error states.
- No global store beyond the above.

### Error/empty/loading
Every data view renders explicit loading, error (friendly message via `lib/errors.ts`),
and empty states.

---

## Risk / security review (Phase 1)

| Risk | Mitigation in this design |
|---|---|
| Tenant data leak | RLS on every table keyed to `auth.uid()`; verified per-table in Phase 2 |
| Cross-tenant FK link (attach another user's recipe/firing/parent) | Composite FKs incl. `user_id` for cascade children; `tests_validate_refs` trigger for the nullable optional links — parent & child must share an owner either way |
| Free-cap race / credit double-spend | Per-user advisory lock on the cap trigger; atomic guarded `ai_credits` decrement with refund-on-failure |
| `SECURITY DEFINER` search_path hijack | All definer functions pinned with `SET search_path = ''` |
| User self-upgrades plan / credits | Column-level grants; only the webhook (service-role) writes those |
| Free-tier bypass (>10 tests) | DB BEFORE-INSERT trigger, not just frontend |
| Secret-key exposure | Keys only in Edge Function env; frontend anon-only; `.env.local` gitignored |
| Admin access by non-owner | Server-side `OWNER_USER_ID` check in Edge Functions; admin never via PostgREST |
| Stripe spoofing / double-credit | Webhook signature verify + idempotent `stripe_event_id` |
| AI asserting chemistry / food-safety | Edge-function prompt constraints; always "verify on a tile"; never claims food-safe |
| Photo privacy | Private bucket + per-user-folder RLS + signed URLs |
| Injection / XSS | Parameterized PostgREST/queries; React escaping; input validation both layers |

**Decisions (approved):** (1) **TypeScript** from scaffold; (2) **TanStack Query** for
server state; (3) one AI feature (`glaze-suggest`) only; (4) **all secret-key features
(paid/Stripe + every API key) are last**; (5) **offline logging deferred to a later
phase** — v1 requires connectivity to write (keeps the data layer simple); revisit with
client-UUIDs + a write queue once the core loop is proven; (6) cross-tenant FK ownership,
advisory-locked cap trigger, atomic+refunded credit decrement, and `search_path`-pinned
definer functions are folded into Phase 2.
