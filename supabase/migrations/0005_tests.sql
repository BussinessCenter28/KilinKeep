-- 0005_tests.sql
-- The core object: one test tile. Optional links to a recipe, a firing, and a
-- parent test (lineage / "what changed"). Free users are capped at 10 tests.

create table public.tests (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null default auth.uid() references auth.users (id) on delete cascade,

  -- Exactly one glaze source: a saved recipe OR an unsaved quick glaze.
  recipe_id      uuid        references public.recipes (id) on delete set null,
  quick_glaze    text,

  -- Lineage: the single change vs. the parent.
  parent_test_id uuid        references public.tests (id) on delete set null,
  change_note    text,

  clay_body      text,
  firing_id      uuid        references public.firings (id) on delete set null,
  cone           text,
  atmosphere     text        check (atmosphere in ('oxidation', 'reduction')),
  application    text        check (application in ('1 coat', '2 coat', 'dip', 'brush', 'spray', 'pour')),
  result_rating  integer     check (result_rating between 1 and 5),
  result_tags    text[]      not null default '{}',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Target for composite FKs (test_photos pins same-owner).
  unique (id, user_id),

  -- Exactly one glaze source: a saved recipe XOR a non-blank quick glaze.
  constraint tests_one_glaze_source
    check ((recipe_id is not null)
           <> (quick_glaze is not null and length(btrim(quick_glaze)) > 0)),

  -- A test cannot be its own parent (deeper cycles are prevented in the app).
  constraint tests_no_self_parent check (parent_test_id is null or parent_test_id <> id)
);

create index tests_user_created_idx on public.tests (user_id, created_at desc, id desc);
create index tests_parent_idx       on public.tests (parent_test_id);
create index tests_recipe_idx       on public.tests (recipe_id);
create index tests_firing_idx       on public.tests (firing_id);

create trigger tests_set_updated_at
  before update on public.tests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Cross-tenant reference guard. A single-column FK only proves the referenced
-- row exists, not that the caller owns it. This trigger asserts that any
-- recipe_id / firing_id / parent_test_id belongs to the SAME user_id, closing
-- the cross-tenant link that RLS-by-user_id alone misses.
-- ---------------------------------------------------------------------------
create or replace function public.tests_validate_refs()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.recipe_id is not null
     and not exists (select 1 from public.recipes r
                     where r.id = new.recipe_id and r.user_id = new.user_id) then
    raise exception 'recipe_id does not belong to this user' using errcode = '42501';
  end if;

  if new.firing_id is not null
     and not exists (select 1 from public.firings f
                     where f.id = new.firing_id and f.user_id = new.user_id) then
    raise exception 'firing_id does not belong to this user' using errcode = '42501';
  end if;

  if new.parent_test_id is not null
     and not exists (select 1 from public.tests t
                     where t.id = new.parent_test_id and t.user_id = new.user_id) then
    raise exception 'parent_test_id does not belong to this user' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger tests_validate_refs_trg
  before insert or update on public.tests
  for each row execute function public.tests_validate_refs();

-- ---------------------------------------------------------------------------
-- Free-tier cap: free users may hold at most 10 tests. The DB is the source of
-- truth (the UI also shows the limit). A per-user transaction advisory lock
-- serializes concurrent inserts so two can't both pass at count = 9.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_free_test_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_plan  text;
  test_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));

  select plan into user_plan from public.profiles where user_id = new.user_id;

  if user_plan = 'free' then
    select count(*) into test_count from public.tests where user_id = new.user_id;
    if test_count >= 10 then
      raise exception 'Free plan is limited to 10 tests. Unlock for unlimited tests.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_free_test_cap_trg
  before insert on public.tests
  for each row execute function public.enforce_free_test_cap();

-- ---------------------------------------------------------------------------
-- Preserve glaze identity when a referenced recipe is deleted. Plain
-- ON DELETE SET NULL would leave the test with neither recipe_id nor
-- quick_glaze, violating tests_one_glaze_source and blocking the delete. This
-- BEFORE DELETE trigger on recipes backfills quick_glaze from the recipe name
-- and detaches the tests first; the FK's SET NULL then finds nothing to do.
-- Defined here because it references public.tests (created above) and
-- public.recipes (migration 0003). Runs as the invoker; RLS still scopes the
-- UPDATE to the user's own tests.
-- ---------------------------------------------------------------------------
create or replace function public.recipes_detach_from_tests()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.tests
     set quick_glaze = coalesce(nullif(btrim(quick_glaze), ''), old.name),
         recipe_id   = null
   where recipe_id = old.id;
  return old;
end;
$$;

create trigger recipes_detach_from_tests_trg
  before delete on public.recipes
  for each row execute function public.recipes_detach_from_tests();

alter table public.tests enable row level security;

create policy "tests_select_own"
  on public.tests for select to authenticated
  using (user_id = auth.uid());

create policy "tests_insert_own"
  on public.tests for insert to authenticated
  with check (user_id = auth.uid());

create policy "tests_update_own"
  on public.tests for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "tests_delete_own"
  on public.tests for delete to authenticated
  using (user_id = auth.uid());
