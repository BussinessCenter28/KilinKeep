// Service-role client factory + JWT helpers for Edge Functions.
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected into the function
// runtime — the service-role key NEVER leaves the server. The frontend never
// sees it (mandate). We use it only after verifying the caller.
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Function runtime is missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Resolve the caller from their bearer token, or null if missing/invalid. */
export async function getCaller(req: Request, admin: SupabaseClient): Promise<User | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** True only when the caller is the single server-configured owner. */
export function isOwner(user: User | null): boolean {
  const ownerId = Deno.env.get("OWNER_USER_ID");
  return !!ownerId && !!user && user.id === ownerId;
}
