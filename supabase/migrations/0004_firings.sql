-- 0004_firings.sql
-- Firing log. schedule holds optional ramp segments [{rate, temp, hold}].

create table public.firings (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kiln        text,
  date        date,
  type        text        not null check (type in ('bisque', 'glaze', 'other')),
  target_cone text,
  atmosphere  text        check (atmosphere in ('oxidation', 'reduction')),
  schedule    jsonb,
  cost        numeric(10, 2) check (cost is null or cost >= 0),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id)
);

create index firings_user_date_idx on public.firings (user_id, date desc);

create trigger firings_set_updated_at
  before update on public.firings
  for each row execute function public.set_updated_at();

alter table public.firings enable row level security;

create policy "firings_select_own"
  on public.firings for select to authenticated
  using (user_id = auth.uid());

create policy "firings_insert_own"
  on public.firings for insert to authenticated
  with check (user_id = auth.uid());

create policy "firings_update_own"
  on public.firings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "firings_delete_own"
  on public.firings for delete to authenticated
  using (user_id = auth.uid());
