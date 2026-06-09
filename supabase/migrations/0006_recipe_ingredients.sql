-- 0006_recipe_ingredients.sql
-- Ingredients of a recipe. Percent totals are warned-on in the UI (≈100), not
-- DB-enforced. Composite FK pins each ingredient to a recipe the SAME user owns
-- and cascade-deletes with its recipe.

create table public.recipe_ingredients (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id  uuid        not null,
  material   text        not null check (length(btrim(material)) > 0),
  percent    numeric(7, 3) not null check (percent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Same-owner guarantee + cascade: references recipes(id, user_id), not just id.
  constraint recipe_ingredients_recipe_fk
    foreign key (recipe_id, user_id)
    references public.recipes (id, user_id)
    on delete cascade
);

create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);

create trigger recipe_ingredients_set_updated_at
  before update on public.recipe_ingredients
  for each row execute function public.set_updated_at();

alter table public.recipe_ingredients enable row level security;

create policy "recipe_ingredients_select_own"
  on public.recipe_ingredients for select to authenticated
  using (user_id = auth.uid());

create policy "recipe_ingredients_insert_own"
  on public.recipe_ingredients for insert to authenticated
  with check (user_id = auth.uid());

create policy "recipe_ingredients_update_own"
  on public.recipe_ingredients for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "recipe_ingredients_delete_own"
  on public.recipe_ingredients for delete to authenticated
  using (user_id = auth.uid());
