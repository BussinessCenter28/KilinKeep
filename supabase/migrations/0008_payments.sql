-- 0008_payments.sql
-- Billing history, written ONLY by the stripe-webhook (service-role). Users may
-- read their own rows but never write any. stripe_event_id is unique for
-- webhook idempotency (same Stripe event twice = one row).
--
-- The table exists now so gating is in place; the Stripe-key paths that write it
-- are built LAST (see architecture.md build order).

create table public.payments (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users (id) on delete cascade,
  type            text        not null check (type in ('unlock', 'topup', 'tip')),
  amount          numeric(10, 2) not null check (amount >= 0),
  stripe_event_id text        not null unique,
  created_at      timestamptz not null default now()
);

create index payments_user_created_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

-- Read-only for the owner of the row. No INSERT/UPDATE/DELETE policy exists, so
-- those verbs are denied to authenticated; service_role bypasses RLS to write.
create policy "payments_select_own"
  on public.payments for select to authenticated
  using (user_id = auth.uid());

-- Belt-and-braces: revoke write grants so even a future stray policy can't let
-- users mutate billing history.
revoke insert, update, delete on public.payments from authenticated;
