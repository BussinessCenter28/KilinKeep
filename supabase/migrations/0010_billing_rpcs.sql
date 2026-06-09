-- 0010_billing_rpcs.sql
-- Atomic helpers the Edge Functions call with the SERVICE ROLE only. These run
-- privileged work (credit accounting, applying Stripe payments) that must never
-- be invokable by end users — so EXECUTE is revoked from anon/authenticated and
-- granted only to service_role. All are SECURITY DEFINER with a pinned search_path.
--
-- These exist now so the (deferred) secret-key functions can drop in cleanly. They
-- do nothing on their own until glaze-suggest / stripe-webhook call them.

-- Atomically claim one AI credit. Returns true iff a credit was deducted (caller
-- is unlocked and had > 0). The single guarded UPDATE makes concurrent calls safe.
create or replace function public.claim_ai_credit(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set ai_credits = ai_credits - 1
   where user_id = p_user
     and plan = 'unlocked'
     and ai_credits > 0;
  return found;
end;
$$;

-- Refund one credit (used when the downstream AI call fails after a claim).
create or replace function public.refund_ai_credit(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set ai_credits = ai_credits + 1
   where user_id = p_user;
end;
$$;

-- Apply a Stripe payment exactly once. Inserts the payments row (unique
-- stripe_event_id is the idempotency gate) and, only if it was newly inserted,
-- grants credits / flips plan in the SAME transaction. Returns true iff applied.
create or replace function public.apply_stripe_payment(
  p_event_id text,
  p_user     uuid,
  p_type     text,
  p_amount   numeric,
  p_credits  integer,
  p_unlock   boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.payments (user_id, type, amount, stripe_event_id)
  values (p_user, p_type, p_amount, p_event_id)
  on conflict (stripe_event_id) do nothing;

  if not found then
    return false;  -- already processed (idempotent replay)
  end if;

  update public.profiles
     set ai_credits = ai_credits + coalesce(p_credits, 0),
         plan = case when p_unlock then 'unlocked' else plan end
   where user_id = p_user;

  return true;
end;
$$;

-- Lock these down: only the service role (Edge Functions) may execute them.
revoke execute on function public.claim_ai_credit(uuid)             from public, anon, authenticated;
revoke execute on function public.refund_ai_credit(uuid)            from public, anon, authenticated;
revoke execute on function public.apply_stripe_payment(text, uuid, text, numeric, integer, boolean) from public, anon, authenticated;

grant execute on function public.claim_ai_credit(uuid)              to service_role;
grant execute on function public.refund_ai_credit(uuid)             to service_role;
grant execute on function public.apply_stripe_payment(text, uuid, text, numeric, integer, boolean)  to service_role;
