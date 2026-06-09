-- 0007_test_photos.sql
-- Before/after photos for a test. The file lives in Storage (bucket test-photos,
-- migration 0009); this row is the metadata + path. Composite FK pins each photo
-- to a test the SAME user owns and cascade-deletes with its test.

create table public.test_photos (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  test_id      uuid        not null,
  storage_path text        not null check (length(btrim(storage_path)) > 0),
  is_cover     boolean     not null default false,
  kind         text        not null default 'after' check (kind in ('before', 'after')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint test_photos_test_fk
    foreign key (test_id, user_id)
    references public.tests (id, user_id)
    on delete cascade
);

create index test_photos_test_idx on public.test_photos (test_id);

-- At most one cover photo per test.
create unique index test_photos_one_cover_idx
  on public.test_photos (test_id) where is_cover;

create trigger test_photos_set_updated_at
  before update on public.test_photos
  for each row execute function public.set_updated_at();

alter table public.test_photos enable row level security;

create policy "test_photos_select_own"
  on public.test_photos for select to authenticated
  using (user_id = auth.uid());

create policy "test_photos_insert_own"
  on public.test_photos for insert to authenticated
  with check (user_id = auth.uid());

create policy "test_photos_update_own"
  on public.test_photos for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "test_photos_delete_own"
  on public.test_photos for delete to authenticated
  using (user_id = auth.uid());
