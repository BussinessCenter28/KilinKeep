-- 0003_recipes.sql
-- Recipe library (glaze / slip / underglaze / engobe).

create table public.recipes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  name       text        not null check (length(btrim(name)) > 0),
  type       text        not null check (type in ('glaze', 'slip', 'underglaze', 'engobe')),
  cone       text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Target for composite FKs that pin same-owner references (see tests / ingredients).
  unique (id, user_id)
);

create index recipes_user_name_idx on public.recipes (user_id, name);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;

create policy "recipes_select_own"
  on public.recipes for select to authenticated
  using (user_id = auth.uid());

create policy "recipes_insert_own"
  on public.recipes for insert to authenticated
  with check (user_id = auth.uid());

create policy "recipes_update_own"
  on public.recipes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "recipes_delete_own"
  on public.recipes for delete to authenticated
  using (user_id = auth.uid());
