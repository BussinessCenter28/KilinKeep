# Supabase — schema, migrations & RLS (Phase 2)

Implements the database design in [`../docs/architecture.md`](../docs/architecture.md)
§B. **RLS is ON for every table**, each with explicit SELECT/INSERT/UPDATE/DELETE
policies referencing `auth.uid()`. No Edge Functions or secret keys here — those are
built **last** (Phase 3).

## Migrations (apply in order)

| File | What it creates |
|---|---|
| `0001_helpers.sql` | `pgcrypto`; `set_updated_at()` touch-trigger function |
| `0002_profiles.sql` | `profiles`; signup auto-create trigger; **column guard** on `plan`/`ai_credits` |
| `0003_recipes.sql` | `recipes` (+ `unique(id, user_id)` FK target) |
| `0004_firings.sql` | `firings` (+ `unique(id, user_id)` FK target) |
| `0005_tests.sql` | `tests`; cross-tenant ref guard; free-cap trigger; recipe-detach trigger |
| `0006_recipe_ingredients.sql` | `recipe_ingredients` (composite FK → recipes, cascade) |
| `0007_test_photos.sql` | `test_photos` (composite FK → tests, cascade; one-cover index) |
| `0008_payments.sql` | `payments` (read-own; writes revoked — webhook only) |
| `0009_storage.sql` | private `test-photos` bucket + per-user-folder object policies |

### Apply
```bash
# Local
supabase start
supabase db reset          # runs every migration from scratch

# Remote (a grown-up links the real project first)
supabase link --project-ref <your-ref>
supabase db push
```

## Key security decisions encoded here

- **Tenant isolation:** every policy is `user_id = auth.uid()`. A table with no policy
  is default-deny under RLS.
- **Cross-tenant FK guard:** child-with-parent links (`recipe_ingredients`,
  `test_photos`) use **composite FKs** `(child_id, user_id) → parent(id, user_id)` so a
  client cannot attach another user's row. Optional links that must survive parent
  deletion (`tests.recipe_id` / `firing_id` / `parent_test_id`) use a single-column FK
  `ON DELETE SET NULL` **plus the `tests_validate_refs` trigger** that asserts same-owner.
- **No self-upgrade:** table-wide `UPDATE` on `profiles` is revoked; only
  `(default_cone, units)` are user-updatable. `plan`/`ai_credits` are written solely by
  the service-role (the Stripe webhook).
- **Free cap (10 tests):** enforced by a DB trigger with a per-user advisory lock to
  close the count→insert race.
- **Photos:** private bucket; users touch only their own `"{uid}/…"` folder; reads via
  signed URLs.
- **Hardening:** all `SECURITY DEFINER` functions pin `SET search_path = ''` and
  schema-qualify every reference.

## Verifying RLS in the SQL editor (smoke test; full suite is Phase 6)

Run as two different users by setting the request role + claims, then confirm isolation:

```sql
-- Impersonate user A
select set_config('request.jwt.claims',
  json_build_object('sub', '<USER_A_UUID>', 'role', 'authenticated')::text, true);
set role authenticated;

insert into public.recipes (name, type) values ('Test Glaze', 'glaze');  -- ok (own row)
select count(*) from public.tests;                                       -- only A's rows

-- Self-upgrade must FAIL (column guard):
update public.profiles set plan = 'unlocked' where user_id = '<USER_A_UUID>';  -- permission denied

-- Cross-tenant link must FAIL (trigger): referencing user B's recipe id
insert into public.tests (recipe_id) values ('<USER_B_RECIPE_UUID>');          -- raises 42501

reset role;
```

Expected: a user reads/writes only their own rows; `plan`/`ai_credits` updates are
denied; cross-tenant references raise; the 11th test for a free user is rejected; signup
auto-creates a `profiles` row.
