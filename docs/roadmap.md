# Build roadmap (do in order; pause at grown-up steps)

1. **Setup (grown-up):** create the private GitHub repo + connect Vercel; create the
   Supabase project.
2. **Core loop screens** (no accounts yet): Tests list, New Test, Test detail. This is the
   whole product — make it fast and good before anything else.
3. **Recipes + Firings:** recipe list/detail with batch calculator; firing list/detail.
   Link tests to recipes and firings.
4. **Variable diffing / lineage:** "what changed from…" parent picker + the lineage strip
   on Test detail. This is the wedge — don't skip it.
5. **Glaze-suggest (AI).** PAUSE: a grown-up provides the Anthropic API key (stored in env).
   Call the AI only from a server function; it never states chemistry/food-safety as fact.
6. **Accounts + free/paid unlock.** PAUSE: a grown-up sets up Stripe for the one-time $9.99
   and AI top-ups.
7. **Privacy policy + polish** (loading/empty/error states, export, settings).
8. **Launch free** to one niche — share the web link where glaze-testing potters already
   gather (r/Pottery, r/ceramics, a studio, a specific group). Decide this channel early.
9. **Later:** line/triaxial blend builder, admin pages (owner-only), then a PWA/store listing.
