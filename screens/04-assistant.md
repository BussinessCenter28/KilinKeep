# Screen 04 - Assistant  (the paid money-maker)

**Purpose:** turn a fired result into the next step.
**Reached:** "Assistant" on Home, or "Diagnose & suggest next" on Test detail.

**Shows:** the selected test (photo, glaze, firing conditions, result tags/notes) and a
"Diagnose & suggest" button. After generating: a result card with **Likely cause** and
**Try next** (exactly ONE suggested change), plus a "Start a new test from this suggestion" button.

**Behavior / rules**
- "Diagnose" calls the Anthropic API from a SERVER function only (Supabase Edge Function). The API key is secret, never in the browser.
- The AI **never** states glaze chemistry or food-safety as fact, and never says a glaze is food-safe. Every answer ends with "verify on a tile."
- It suggests exactly one variable to change, phrased as an action.
- "Start a new test from this suggestion" -> New test (02), pre-filled, parent = current test.

**Cost:** each suggestion costs a little (the Anthropic bill). The unlock includes ~100 suggestions; a top-up adds more.
**Build later:** needs the Anthropic API key first (a grown-up step - pause).
