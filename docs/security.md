# Security & safety rules

- Secret keys (Anthropic, Stripe) NEVER in the frontend or in git. Environment settings
  only. `.gitignore` anything holding secrets.
- **The AI never states glaze chemistry or food-safety as fact.** It gives a likely cause
  and one suggested change, always with "verify on a tile." It must never tell a user a
  glaze is food-safe — only that food-safety must be confirmed independently.
- No scraping any website (including Glazy or supplier sites). Users paste/import their own
  recipes. Any future external data uses official APIs only.
- No auto-posting / auto-sharing to communities. If a user shares a result, they do it
  themselves.
- User data is private via Supabase Row Level Security: each user can only read/write
  their own rows.
- Admin pages are owner-only. Check the owner identity on the SERVER, not just by hiding
  the page in the app.
- All content stays age-appropriate and honest.
- A grown-up owns every real account, key, and payment. Pause and ask when one is needed.
