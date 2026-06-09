# Kilnkeep — Mockup Spec (for Claude Code)

Build **static, clickable mockups** first (mock data, no backend). Wire Supabase + the AI call
after the screens feel right. Mobile-first; design for a phone, scale up gracefully.

## Design direction
- **Mood:** earthy, tactile, calm. A studio bench, not a SaaS dashboard.
- **Palette:**
  - Background / stoneware: `#F4F1EA`
  - Surface / card: `#FBF9F4`
  - Text / charcoal: `#2B2622`
  - Primary / clay: `#B5654A`
  - Highlight / kiln amber: `#D99A4E`
  - Secondary / ash sage: `#8A8B7C`
  - Success / good-firing green, Warning / under-fired amber, Danger / defect red — muted, not neon.
- **Type:** humanist serif for headers (Fraunces / Lora feel), clean sans for UI + body (Inter).
- **Feel:** photo-forward, generous spacing, **large tap targets** (studio hands are wet/messy —
  big buttons, minimal typing, lots of tap-to-pick).
- Rounded corners, soft shadows, subtle paper/grain texture optional.

## Global layout
- **Bottom tab bar (mobile):** Tests · Recipes · Firings · Assistant. Settings via a gear in the
  top-right header.
- **Header:** screen title + contextual action (e.g. "+ New").
- A persistent **"+" FAB** on Tests for one-tap new test.

---

## 1. Tests (home / list)
**Purpose:** see your testing history at a glance; add a new test fast.
- Header: "Kilnkeeps" + gear icon.
- Filter chips row: Cone, Glaze, Result (Good / Under / Over / Defect), Clay body.
- Grid/list of **test cards**: square photo thumbnail, glaze name, cone, a colored result dot,
  date. If a test links to a parent, show a small "↳ iteration" tag.
- FAB "+" → New Test.
- **Empty state:** friendly illustration + "Log your first test tile" CTA.

## 2. New / Edit Test
**Purpose:** capture a test in well under a minute. Minimize typing.
- **Photo first:** big camera/upload tile at top (can add multiple; first = cover).
- Fields (all tap-to-pick where possible):
  - Glaze / recipe (pick from Recipes, or "quick glaze" free text).
  - Layers / application (dropdown: 1/2/3 coats, dip, brush, spray, pour).
  - Clay body (pick).
  - Cone (pick: 04, 5, 6, 10…), atmosphere (oxidation / reduction).
  - Link to a Firing (optional, pick from Firings) OR quick cone+date.
  - **"What changed from…"** picker → select a previous test as *parent*; show a one-line diff
    helper where the user notes the single change (this powers the wedge).
  - Result rating (1–5) + result tags (glossy, matte, crazed, pinholed, crawled, ran, dry…).
  - Notes (free text).
- Sticky "Save" button.

## 3. Test Detail
**Purpose:** review one test + its lineage + get the AI nudge.
- Large photo carousel (before/after if both exist).
- Summary block: glaze, recipe link, clay body, cone, atmosphere, application, firing link.
- **Lineage strip:** horizontal chain of parent → this → children tests (tap to jump). This is
  the visible payoff of variable diffing — show "what changed" labels between nodes.
- Result: rating + tags + notes.
- **"Diagnose & suggest next" button** (primary, clay color) → opens Assistant pre-loaded with
  this test (see §9). Free users see a lock badge → paywall sheet.
- Actions: edit, duplicate-as-new-test (carries fields forward, sets this as parent), delete
  (with undo).

## 4. Recipes (list)
- List of recipe cards: name, cone, tiny ingredient count, # of linked tests.
- "+ New Recipe". Search bar.
- Empty state: "Add a glaze recipe or paste one in."

## 5. Recipe Detail / Edit
- Name, cone, type (glaze / slip / underglaze / engobe), notes.
- **Ingredients table:** material + percentage rows; running total with a warning if ≠ 100%.
- Batch calculator: enter total grams → computes each material's grams.
- "Linked tests" section: thumbnails of every test using this recipe (tap through).
- (Optional later: simple UMF readout. Do NOT block MVP on glaze chemistry.)

## 6. Firings (list)
- List of firing cards: date, kiln, cone, type (bisque / glaze), # of tests/pieces in it.
- "+ New Firing".

## 7. New / Edit Firing
- Kiln (pick), date, type (bisque / glaze / other), target cone, atmosphere.
- Schedule (optional): ramp segments (rate °/hr, target temp, hold min) as repeatable rows.
- Cost (optional): kWh or flat — drives a simple "cost per firing" later.
- Notes. Save.

## 8. Assistant (AI) — the single AI feature
**Purpose:** turn a result into a next step. ONE feature, do it well.
- Two entry modes:
  1. From a Test Detail ("Diagnose & suggest next") — pre-filled.
  2. From the tab — pick a test, or describe a result.
- Input shown to user: recipe summary + firing conditions + result tags/notes + photo.
- Output card:
  - **Likely cause** (1–2 sentences).
  - **Try next** — exactly ONE suggested variable change, phrased as an action ("Drop one layer
    and refire at cone 6" / "Add 2% silica to reduce crazing").
  - "Start a new test from this suggestion" button → New Test pre-filled with parent = current.
- Disclaimer line: "Suggestions are a starting point, not chemistry gospel — verify on a tile."
- Free users: locked → paywall sheet.

## 9. Settings
- Account (Supabase auth).
- **Manage pick-lists:** clay bodies, kilns, cones, result tags (so logging stays tap-fast).
- **Export all data** (JSON + photos zip) — surface this loudly; "your data is yours" is part of
  the pitch.
- **Unlock** (one-time purchase via Stripe): shows free-tier usage vs. unlocked.
- About / contact.

---

## Paywall sheet (reusable)
Triggered by AI use or hitting free limits. Plain and honest:
- "Kilnkeep is free for 10 tests. Unlock everything once — no subscription."
- Bullets: unlimited tests + recipes · AI diagnose & suggest · full export.
- One button: "Unlock — $9.99 once." Secondary: "Maybe later."

## Build order for mockups
1. Tests list + New Test + Test Detail (the core loop — get this feeling fast and good first).
2. Recipes list + detail.
3. Firings list + detail.
4. Assistant screen (mock the AI output with canned text until wired).
5. Settings + paywall sheet.
