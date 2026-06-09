// Typed wrapper around supabase.functions.invoke for our Edge Functions.
// supabase-js attaches the user's JWT automatically. On a non-2xx response the
// function's normalized { error: { code, message } } body lives on error.context
// (a Response); we surface it as a FunctionError so callers can branch on `.code`
// (e.g. "not_configured", "locked", "no_credits") and show `.message` directly.
import { supabase } from './supabase';

export class FunctionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'FunctionError';
    this.code = code;
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string };
}

function hasResponseContext(e: unknown): e is { context: Response } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'context' in e &&
    (e as { context?: unknown }).context instanceof Response
  );
}

export async function invokeFunction<T>(
  name: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body: body ?? {} });

  if (error) {
    if (hasResponseContext(error)) {
      try {
        const parsed = (await error.context.json()) as ErrorBody;
        if (parsed.error?.code) {
          throw new FunctionError(parsed.error.code, parsed.error.message ?? 'Request failed.');
        }
      } catch (parseErr) {
        if (parseErr instanceof FunctionError) throw parseErr;
        // body wasn't our shape — fall through to a generic error
      }
    }
    throw new FunctionError('network', 'Could not reach the server. Please try again.');
  }

  if (data == null) throw new FunctionError('empty', 'No response from the server.');
  return data;
}

/** Pull a { code, message } out of any thrown value for UI branching. */
export function functionErrorInfo(err: unknown): { code: string; message: string } {
  if (err instanceof FunctionError) return { code: err.code, message: err.message };
  return { code: 'unknown', message: 'Something went wrong. Please try again.' };
}
