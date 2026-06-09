# Data model (Supabase)

Start simple; add fields as needed. Turn Row Level Security ON for every user table.

## recipes
- id (uuid, primary key)
- user_id (uuid -> auth user)
- name (text)
- type (text: glaze / slip / underglaze / engobe)
- cone (text)
- notes (text)
- created_at (timestamp)

## recipe_ingredients
- id (uuid, primary key)
- user_id (uuid -> auth user)
- recipe_id (uuid -> recipes)
- material (text)
- percent (numeric)        - UI warns if a recipe's percents don't total ~100

## firings
- id (uuid, primary key)
- user_id (uuid -> auth user)
- kiln (text)
- date (date)
- type (text: bisque / glaze / other)
- target_cone (text)
- atmosphere (text: oxidation / reduction)
- schedule (jsonb)         - optional ramp segments [{rate, temp, hold}]
- cost (numeric)           - optional
- notes (text)

## tests  (the core object — one test tile)
- id (uuid, primary key)
- user_id (uuid -> auth user)
- recipe_id (uuid -> recipes, nullable)   - or quick_glaze text for an unsaved glaze
- quick_glaze (text, nullable)
- parent_test_id (uuid -> tests, nullable) - lineage / "what changed" diffing
- change_note (text)        - the single change vs the parent
- clay_body (text)
- firing_id (uuid -> firings, nullable)
- cone (text)
- atmosphere (text)
- application (text: 1 coat / 2 coat / dip / brush / spray / pour)
- result_rating (int 1-5)
- result_tags (text[])      - glossy, matte, crazed, pinholed, crawled, ran, dry...
- notes (text)
- created_at (timestamp)

## test_photos
- id (uuid, primary key)
- user_id (uuid -> auth user)
- test_id (uuid -> tests)
- storage_path (text -> Supabase Storage, bucket `test-photos`)
- is_cover (bool)
- kind (text: before / after)

## profiles  (one row per user)
- user_id (uuid, primary key -> auth user)
- plan (text: free / unlocked)
- ai_credits (int)          - glaze-suggest uses remaining
- default_cone (text, default 'cone 6')   - user-editable
- units (text, default 'g')                - user-editable
RLS: a user can only see/edit their own rows; `plan` and `ai_credits` are NOT
user-editable (see architecture.md).

## payments  (later; filled from Stripe)
- id, user_id, type (unlock / topup / tip), amount, stripe_event_id (unique), created_at

Photos live in Supabase Storage (private). Secret keys live in env settings, never in the
database or the code.
