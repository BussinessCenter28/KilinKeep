# Screen 01 - Home / Tests

**Purpose:** the main screen; your test tiles at a glance.
**Reached:** opening the app / the Tests tab.

**Shows**
- A small stats strip: Tests logged, Keepers (results rated 4-5 stars), Open experiments (tests with no result yet).
- Filter chips: Cone, Glaze, Result (Good / Under / Over / Defect), Clay body.
- A grid of test cards: photo, glaze name, cone, a colored result dot, date. A "iteration" tag if the test links to a parent.

**Buttons / actions**
- "+ New test" -> New test (screen 02).
- "Assistant" (highlighted) -> Assistant (screen 04).
- Tap a test card -> Test detail (screen 03).
- Settings gear (top right) -> Settings (screen 07).
- Bottom tabs: Tests (01) / Recipes (05) / Firings (06) / Assistant (04).

**Data:** reads the logged-in user's tests from Supabase (`tests` table).
**Rules:** free users limited to ~10 tests; unlocked users unlimited.
