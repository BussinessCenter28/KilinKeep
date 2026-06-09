# Screen 03 - Test detail

**Purpose:** view one test and its lineage.
**Reached:** tap a test on Home.

**Shows:** large photo (before/after carousel if both exist); a summary (glaze / recipe link,
clay body, cone, atmosphere, application, firing link); a **lineage strip** (parent -> this ->
children, with the "what changed" label between nodes); result (rating, tags, notes).

**Buttons / actions**
- "Diagnose & suggest next" (highlighted) -> Assistant (04), pre-loaded with this test. Locked for free users -> paywall.
- "Duplicate as new test" -> New test (02) pre-filled, with this test set as the parent.
- Edit icon (top right) -> edit the test's fields.
- Delete (with undo).

**Data:** reads the one test and its lineage from Supabase.
