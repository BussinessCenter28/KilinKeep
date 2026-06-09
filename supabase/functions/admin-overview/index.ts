// admin-overview — owner-only aggregate dashboard. The owner check is SERVER-SIDE
// (caller must equal OWNER_USER_ID); admin data never flows through PostgREST/RLS
// (which would scope it to the owner's own rows). Read-only.
import { handlePreflight, ok, fail } from "../_shared/http.ts";
import { adminClient, getCaller, isOwner } from "../_shared/supabase.ts";

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

  const countOf = async (table: string, filter?: (q: ReturnType<typeof admin.from>) => unknown) => {
    let q = admin.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q) as typeof q;
    const { count } = await q;
    return count ?? 0;
  };

  const [users, unlocked, tests, recipes, firings, payments] = await Promise.all([
    countOf("profiles"),
    countOf("profiles", (q) => q.eq("plan", "unlocked")),
    countOf("tests"),
    countOf("recipes"),
    countOf("firings"),
    admin.from("payments").select("amount"),
  ]);

  const revenue = (payments.data ?? []).reduce(
    (sum: number, p: { amount: number }) => sum + Number(p.amount ?? 0),
    0,
  );

  return ok({
    users,
    unlocked_users: unlocked,
    free_users: users - unlocked,
    tests,
    recipes,
    firings,
    revenue,
  });
});
