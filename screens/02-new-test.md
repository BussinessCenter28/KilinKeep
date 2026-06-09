# Screen 02 - New test

**Purpose:** log a new test tile in under a minute.
**Reached:** "+ New test" on Home; or "Duplicate as new test" from Test detail.

**Fields (tap-to-pick wherever possible):** photo(s) (upload to Supabase Storage, first = cover),
glaze (pick from Recipes, or "quick glaze" free text), application (1 / 2 / 3 coats, dip, brush,
spray, pour), clay body, cone, atmosphere (oxidation / reduction), link to a Firing (optional,
screen 06) or a quick cone + date, "What changed from..." (pick a previous test as the parent) +
a one-line change note, result rating (1-5) + result tags (glossy, matte, crazed, pinholed,
crawled, ran, dry...), notes.

**Buttons / actions**
- "Save test" -> writes the test to Supabase, returns to Home.

**Behavior:** minimal typing; big tap targets (studio hands are messy). If a parent is picked, prompt for the single change.
**Rule:** the AI never fills in results; the potter records what actually happened.
