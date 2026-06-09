// admin-users — owner-only, paginated list of profiles (no PII: profiles hold no
// email; email lives in auth.users and is intentionally not exposed here).
// Keyset pagination on created_at desc.
import { handlePreflight, ok, fail } from "../_shared/http.ts";
import { adminClient, getCaller, isOwner } from "../_shared/supabase.ts";

const PAGE = 50;

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return fail("method_not_allowed", "Use POST.", 405);
  if (!Deno.env.get("OWNER_USER_ID")) return fail("not_configured", "Admin not enabled.", 503);

  let admin;
  try {
    admin = adminClient();
  } catch {
    return fail("server_error", "Server is misconfigured.", 500);
  }

  const caller = await getCaller(req, admin);
  if (!caller) return fail("unauthorized", "Please sign in.", 401);
  if (!isOwner(caller)) return fail("forbidden", "Not authorized.", 403);

  let before: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.before === "string") before = body.before;
  } catch {
    // empty body is fine
  }

  let q = admin
    .from("profiles")
    .select("user_id, plan, ai_credits, default_cone, units, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE + 1);
  if (before) q = q.lt("created_at", before);

  const { data, error } = await q;
  if (error) return fail("server_error", "Could not load users.", 500);

  const rows = data ?? [];
  const hasMore = rows.length > PAGE;
  const page = hasMore ? rows.slice(0, PAGE) : rows;
  const nextCursor = hasMore ? page[page.length - 1]?.created_at ?? null : null;

  return ok({ users: page, nextCursor });
});
