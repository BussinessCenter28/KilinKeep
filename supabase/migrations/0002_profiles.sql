-- 0002_profiles.sql
-- One row per user. Holds plan + AI credits (server-writable only) and
-- user-editable preferences (default_cone, units).

create table public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  plan         text        not null default 'free'   check (plan in ('free', 'unlocked')),
  ai_credits   integer     not null default 0        check (ai_credits >= 0),
  default_cone text        not null default 'cone 6',
  units        text        not null default 'g'      check (units in ('g', 'oz')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user profile. plan/ai_credits are written ONLY by the stripe-webhook (service-role); see column grants below.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: a user sees and edits only their own row. No user INSERT (the signup
-- trigger below creates it) and no DELETE (row dies with the auth user).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Column guard: even with the update policy above, a user must not be able to
-- set plan or ai_credits. Revoke table-wide UPDATE and grant it back only on
-- the two preference columns. (service_role bypasses RLS + grants entirely.)
-- ---------------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant  update (default_cone, units) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when an auth user is created. SECURITY DEFINER so
-- it can write public.profiles regardless of the caller; search_path pinned to
-- block search-path hijacking; schema-qualify everything.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
