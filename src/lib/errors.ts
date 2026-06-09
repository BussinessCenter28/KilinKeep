// Normalize Supabase / Edge Function / Postgres errors into safe, friendly messages.
// NEVER surface raw DB errors to the UI (they can leak schema/internals). Every
// service catches and routes through toFriendlyMessage.

import type { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  code: string;
  message: string;
}

// Postgres / app-specific error codes we map to friendly copy.
const FRIENDLY_BY_CODE: Record<string, string> = {
  // raised by enforce_free_test_cap()
  P0001: 'You’ve reached the free limit of 10 tests. Unlock for unlimited tests.',
  // raised by tests_validate_refs() (insufficient_privilege)
  '42501': 'That item could not be linked. Please pick one of your own.',
  // unique_violation
  '23505': 'That already exists.',
  // foreign_key_violation
  '23503': 'A linked item is missing. Refresh and try again.',
  // check_violation
  '23514': 'Some values are out of range. Please review the form.',
  // not_null_violation
  '23502': 'A required field is missing.',
};

function isPostgrestError(e: unknown): e is PostgrestError {
  return typeof e === 'object' && e !== null && 'code' in e && 'message' in e;
}

/** Map any thrown error to a short, user-safe string. */
export function toFriendlyMessage(e: unknown): string {
  if (isPostgrestError(e)) {
    const mapped = e.code ? FRIENDLY_BY_CODE[e.code] : undefined;
    if (mapped) return mapped;
    // A raised exception (e.g. the cap trigger) carries its message in .message.
    if (e.message && /free limit|free plan/i.test(e.message)) {
      return FRIENDLY_BY_CODE.P0001 ?? 'You’ve reached the free limit of 10 tests.';
    }
  }

  // Supabase Auth errors expose a safe .message.
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const msg = String((e as { message: unknown }).message);
    if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
    if (/email not confirmed/i.test(msg)) return 'Please confirm your email, then sign in.';
    if (/user already registered/i.test(msg)) return 'That email is already registered. Try signing in.';
    if (/rate limit|too many requests/i.test(msg)) return 'Too many attempts. Please wait a moment.';
    if (msg && msg.length < 160 && !/postgres|sql|relation|column/i.test(msg)) return msg;
  }

  return 'Something went wrong. Please try again.';
}

/** Normalize to an AppError shape (for places that want a code too). */
export function toAppError(e: unknown): AppError {
  const message = toFriendlyMessage(e);
  const code = isPostgrestError(e) && e.code ? e.code : 'unknown';
  return { code, message };
}
