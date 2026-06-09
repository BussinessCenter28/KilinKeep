-- 0001_helpers.sql
-- Shared helpers used by every table. No app tables here.
--
-- Phase 2 (Kilnkeep). Governed by docs/mandate.md + docs/architecture.md.
-- RLS-first: every app table created in later migrations enables RLS and defines
-- explicit SELECT/INSERT/UPDATE/DELETE policies referencing auth.uid().

-- gen_random_uuid() is built in on Postgres 13+ (Supabase). pgcrypto kept for parity.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at touch trigger. SECURITY DEFINER is unnecessary here (runs as the
-- writing user), but we still pin search_path defensively.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Maintains updated_at on row UPDATE. Attached per-table in later migrations.';
