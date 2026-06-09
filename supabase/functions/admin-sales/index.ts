// admin-sales — owner-only sales summary: totals by purchase type + recent
// payments. Read-only, server-verified owner.
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

  const { data, error } = await admin
    .from("payments")
    .select("type, amount, created_at")
    .order("created_at", { ascending: false });
  if (error) return fail("server_error", "Could not load sales.", 500);

  const rows = data ?? [];
  const byType: Record<string, { count: number; total: number }> = {};
  let grandTotal = 0;
  for (const p of rows) {
    const t = p.type as string;
    const amt = Number(p.amount ?? 0);
    byType[t] ??= { count: 0, total: 0 };
    byType[t]!.count += 1;
    byType[t]!.total += amt;
    grandTotal += amt;
  }

  return ok({
    total_revenue: grandTotal,
    by_type: byType,
    recent: rows.slice(0, 20),
  });
});
