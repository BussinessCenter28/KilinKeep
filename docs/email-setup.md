# Email setup (Resend → Supabase SMTP)

By default Supabase uses a shared email sender with a very low hourly limit (that's the
"email rate limit exceeded" error). Connecting **Resend** as a custom SMTP sender fixes
that and gives reliable delivery.

> The Resend **API key is a secret**. It goes ONLY in Supabase's SMTP settings. Never put
> it in the app, in `.env.local`, or in git. A grown-up sets this up.

## 1. Resend account
1. Sign up at **resend.com**.
2. **Domains → Add Domain** → add a domain you own (e.g. `kilnkeep.app`). Resend shows DNS
   records (SPF / DKIM) — add them at your domain registrar, then click **Verify**.
   (Without a domain you can only test to your own email using `onboarding@resend.dev` —
   fine for trying it, not for real users.)
3. **API Keys → Create API Key** (Sending access). Copy it now — it's shown once. It looks
   like `re_xxxxxxxx`.

## 2. Supabase — enable custom SMTP
Authentication → **Emails → SMTP Settings** (or Project Settings → Auth) → **Enable Custom
SMTP**, then enter:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) — or `587` (TLS) |
| Username | `resend` |
| Password | your Resend **API key** (`re_...`) |
| Sender email | e.g. `noreply@yourdomain.com` (must be on the verified domain) |
| Sender name | `Kilnkeep` |

Save.

## 3. Raise the auth email rate limit
Authentication → **Rate Limits** → increase "emails per hour" (the old low limit was
because of the shared sender; with Resend you can raise it).

## 4. Test
- Re-enable **Confirm email** (Authentication → Email) if you turned it off.
- Sign up with a real address → you should get a confirmation email from your sender. Try
  "Forgot password?" too.

## Notes
- Free tier ~3,000 emails/month — plenty for launch (≈ one email per new signup).
- Kilnkeep only emails for sign-up confirmation + password resets. Stripe sends its own
  receipts later.
