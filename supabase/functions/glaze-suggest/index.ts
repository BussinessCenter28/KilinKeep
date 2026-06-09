// glaze-suggest — diagnose a fired test + suggest exactly ONE change to try next.
//
// Security boundary: verify the caller's JWT; load the test (+recipe+firing) with
// the service role and confirm the caller OWNS it; require plan=unlocked & a
// credit; atomically CLAIM one credit before the model call and REFUND it if the
// call fails. The Anthropic key never leaves this server.
//
// Safety (non-negotiable): the model must NEVER assert glaze chemistry or
// food-safety as fact. It returns a likely cause + one change, always "verify on
// a tile." Enforced in the system prompt below.
import { handlePreflight, ok, fail } from "../_shared/http.ts";
import { adminClient, getCaller } from "../_shared/supabase.ts";

// Cheapest current model — this is a low-cost, high-volume per-call feature.
const MODEL = "claude-haiku-4-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are a careful glaze-testing assistant for studio potters.
Given one test tile's recipe, firing, and result, reply with a single likely cause
and exactly ONE change to try next.

Hard rules:
- NEVER state glaze chemistry or food-safety as fact. Do not call any glaze food-safe.
  If asked about food-safety, say it must be independently confirmed (e.g. lab leach test).
- Offer ONE change only, phrased as something to try, not a guarantee.
- Always remind the user to verify the result on a test tile.
- Be concrete and brief. No preamble.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    likely_cause: { type: "string", description: "One plausible cause of the observed result." },
    suggested_change: {
      type: "string",
      description: "Exactly one change to try next; ends by reminding to verify on a tile.",
    },
  },
  required: ["likely_cause", "suggested_change"],
};

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return fail("method_not_allowed", "Use POST.", 405);

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    return fail("not_configured", "The Assistant isn’t enabled yet.", 503);
  }

  let admin;
  try {
    admin = adminClient();
  } catch {
    return fail("server_error", "Server is misconfigured.", 500);
  }

  const caller = await getCaller(req, admin);
  if (!caller) return fail("unauthorized", "Please sign in.", 401);

  // --- validate input ---
  let testId: unknown;
  try {
    ({ test_id: testId } = await req.json());
  } catch {
    return fail("bad_request", "Invalid JSON body.", 400);
  }
  if (typeof testId !== "string" || !/^[0-9a-f-]{36}$/i.test(testId)) {
    return fail("bad_request", "A valid test_id is required.", 400);
  }

  // --- load test + relations, confirm ownership (service role bypasses RLS, so
  //     we MUST check user_id ourselves) ---
  const { data: test, error: testErr } = await admin
    .from("tests")
    .select("*, recipe:recipes(name, type, cone, recipe_ingredients(material, percent)), firing:firings(*)")
    .eq("id", testId)
    .maybeSingle();
  if (testErr) return fail("server_error", "Could not load the test.", 500);
  if (!test || test.user_id !== caller.id) {
    return fail("not_found", "Test not found.", 404); // don't reveal existence
  }

  // --- gate on plan + credits, then atomically claim one credit ---
  const { data: profile } = await admin
    .from("profiles").select("plan, ai_credits").eq("user_id", caller.id).maybeSingle();
  if (!profile || profile.plan !== "unlocked") {
    return fail("locked", "Unlock Kilnkeep to use the Assistant.", 402);
  }
  const { data: claimed, error: claimErr } = await admin.rpc("claim_ai_credit", { p_user: caller.id });
  if (claimErr) return fail("server_error", "Could not check your AI credits.", 500);
  if (claimed !== true) {
    return fail("no_credits", "You’re out of AI suggestions. Top up to get more.", 402);
  }

  // --- call Anthropic; refund the credit on any failure ---
  try {
    const userContent = buildPrompt(test);
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
      }),
    });

    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const payload = await res.json();
    const textBlock = (payload.content ?? []).find((b: { type: string }) => b.type === "text");
    if (!textBlock?.text) throw new Error("no text block");
    const parsed = JSON.parse(textBlock.text) as { likely_cause: string; suggested_change: string };
    if (!parsed.likely_cause || !parsed.suggested_change) throw new Error("bad shape");

    return ok({ likely_cause: parsed.likely_cause, suggested_change: parsed.suggested_change });
  } catch (_e) {
    await admin.rpc("refund_ai_credit", { p_user: caller.id });
    return fail("ai_failed", "The Assistant couldn’t respond. Your credit was refunded.", 502);
  }
});

// Build a compact, factual description of the test for the model.
function buildPrompt(test: Record<string, unknown>): string {
  const recipe = test.recipe as
    | { name?: string; type?: string; cone?: string; recipe_ingredients?: { material: string; percent: number }[] }
    | null;
  const firing = test.firing as Record<string, unknown> | null;

  const lines: string[] = [];
  lines.push("TEST TILE");
  lines.push(`Glaze: ${recipe?.name ?? (test.quick_glaze as string) ?? "unspecified"}`);
  if (recipe?.recipe_ingredients?.length) {
    lines.push("Recipe (material % ):");
    for (const ing of recipe.recipe_ingredients) lines.push(`  - ${ing.material}: ${ing.percent}`);
  }
  lines.push(`Clay body: ${(test.clay_body as string) ?? "—"}`);
  lines.push(`Cone: ${(test.cone as string) ?? recipe?.cone ?? "—"}`);
  lines.push(`Atmosphere: ${(test.atmosphere as string) ?? "—"}`);
  lines.push(`Application: ${(test.application as string) ?? "—"}`);
  if (firing) {
    lines.push(`Firing: ${firing.type ?? "—"}, target ${firing.target_cone ?? "—"}, ${firing.atmosphere ?? "—"}`);
  }
  const tags = (test.result_tags as string[] | null) ?? [];
  lines.push(`Result rating (1-5): ${(test.result_rating as number) ?? "—"}`);
  lines.push(`Result tags: ${tags.length ? tags.join(", ") : "—"}`);
  lines.push(`Notes: ${(test.notes as string) ?? "—"}`);
  lines.push("");
  lines.push("Give the likely cause and one change to try next.");
  return lines.join("\n");
}
