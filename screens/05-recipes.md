# Screen 05 - Recipes

**Purpose:** your glaze recipes.
**Reached:** the Recipes tab.

**Shows (list):** recipe cards - name, type (glaze / slip / underglaze / engobe), cone,
ingredient count, number of linked tests. A search box and "+ New recipe".

**Shows (detail / edit):** name, type, cone, notes; an **ingredients table** (material + percent,
with a running total that warns if it isn't ~100); a **batch calculator** (enter total grams ->
grams per material); a "Linked tests" row of thumbnails.

**Buttons / actions**
- "+ New recipe" -> create a recipe.
- "Save".
- Tap a linked test -> Test detail (03).

**Data:** reads the user's `recipes` + `recipe_ingredients`.
**Rule:** don't import a big external recipe database; the user adds or pastes their own (no scraping).
