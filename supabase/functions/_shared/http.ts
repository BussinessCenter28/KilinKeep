// Shared HTTP helpers: CORS + a normalized JSON/error response shape. Every
// function returns { error: { code, message } } on failure — never a raw DB or
// third-party error string (mandate: no raw errors, no secrets/PII in responses).

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*", // auth is the JWT / Stripe signature, not origin
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders, ...extra },
  });
}

export function ok<T>(data: T, status = 200): Response {
  return json(data, status);
}

export function fail(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

/** Standard preflight handler. Returns a Response for OPTIONS, else null. */
export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return null;
}
