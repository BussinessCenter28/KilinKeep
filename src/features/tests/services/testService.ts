// All Supabase access for the tests feature lives here. Hooks call these; components
// never touch the client directly. RLS scopes every row to the signed-in user, so we
// don't filter by user_id (and on INSERT we OMIT user_id — the DB default fills it).
import { supabase } from '@/lib/supabase';
import type { Database, Test, TestPhoto, TestWithRelations, PhotoKind } from '@/lib/types';
import { buildPhotoPath, uploadPhoto, removePhoto } from '@/lib/storage';

export interface TestCursor {
  created_at: string;
  id: string;
}

export interface ListTestsParams {
  limit: number;
  cursor?: TestCursor;
  search?: string;
  tag?: string;
  minRating?: number;
}

// A list row carries the cover photo path (if any) so cards can show a thumb without
// a second round-trip per card, plus the recipe name for recipe-based tests.
export interface TestListRow extends Test {
  test_photos: Pick<TestPhoto, 'storage_path' | 'is_cover'>[];
  recipe: { name: string } | null;
}

export interface ListTestsResult {
  rows: TestListRow[];
  nextCursor: TestCursor | null;
}

// New-row payload: the form supplies these; server defaults fill the rest.
export interface CreateTestInput {
  recipe_id?: string | null;
  quick_glaze?: string | null;
  parent_test_id?: string | null;
  change_note?: string | null;
  clay_body?: string | null;
  firing_id?: string | null;
  cone?: string | null;
  atmosphere?: Test['atmosphere'];
  application?: Test['application'];
  result_rating?: number | null;
  result_tags?: string[];
  notes?: string | null;
}

export type UpdateTestPatch = Partial<CreateTestInput>;

/**
 * Keyset-paginated list ordered by (created_at desc, id desc). We fetch limit+1 rows
 * to know whether there's another page, then hand back a cursor built from the last
 * returned row. No OFFSET (it degrades as the table grows).
 */
export async function listTests(params: ListTestsParams): Promise<ListTestsResult> {
  const { limit, cursor, search, tag, minRating } = params;

  let query = supabase
    .from('tests')
    .select('*, recipe:recipes(name), test_photos(storage_path, is_cover)')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    // (created_at, id) < (cursor.created_at, cursor.id) in desc order.
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  }
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`quick_glaze.ilike.${term},clay_body.ilike.${term},notes.ilike.${term}`);
  }
  if (tag) {
    query = query.contains('result_tags', [tag]);
  }
  if (typeof minRating === 'number' && minRating > 0) {
    query = query.gte('result_rating', minRating);
  }

  const { data, error } = await query;
  if (error) throw error;

  const all = (data ?? []) as unknown as TestListRow[];
  const hasMore = all.length > limit;
  const rows = hasMore ? all.slice(0, limit) : all;
  const last = rows[rows.length - 1];
  const nextCursor = hasMore && last ? { created_at: last.created_at, id: last.id } : null;

  return { rows, nextCursor };
}

/** Pick the cover photo path for a list row (prefers is_cover, else the first photo). */
export function coverPath(row: TestListRow): string | null {
  const photos = row.test_photos ?? [];
  const cover = photos.find((p) => p.is_cover);
  return cover?.storage_path ?? photos[0]?.storage_path ?? null;
}

/** Full detail with joined recipe, firing and photos. RLS returns only own rows. */
export async function getTest(id: string): Promise<TestWithRelations | null> {
  const { data, error } = await supabase
    .from('tests')
    .select('*, recipe:recipes(*), firing:firings(*), test_photos(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  // The generic Database type declares no relationships, so supabase-js infers the
  // embedded rows loosely; narrow via unknown to our composite domain type.
  return (data as unknown as TestWithRelations | null) ?? null;
}

export interface TestLineage {
  ancestors: Test[];
  current: Test;
  children: Test[];
}

/**
 * Walk parent_test_id up to the root (ancestors, root-first) and fetch the direct
 * children of the current test. Guards against cycles with a visited set.
 */
export async function getLineage(id: string): Promise<TestLineage | null> {
  const current = await getTestRow(id);
  if (!current) return null;

  const ancestors: Test[] = [];
  const visited = new Set<string>([current.id]);
  let parentId = current.parent_test_id;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = await getTestRow(parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    parentId = parent.parent_test_id;
  }

  const { data: childData, error } = await supabase
    .from('tests')
    .select('*')
    .eq('parent_test_id', current.id)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return { ancestors, current, children: childData ?? [] };
}

async function getTestRow(id: string): Promise<Test | null> {
  const { data, error } = await supabase.from('tests').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTest(input: CreateTestInput): Promise<Test> {
  // OMIT id/user_id/created_at/updated_at — server fills them (user_id = auth.uid()).
  // result_tags is server-defaulted too, but we send it so the row reflects the form.
  const row: Database['public']['Tables']['tests']['Insert'] = {
    recipe_id: input.recipe_id ?? null,
    quick_glaze: input.quick_glaze ?? null,
    parent_test_id: input.parent_test_id ?? null,
    change_note: input.change_note ?? null,
    clay_body: input.clay_body ?? null,
    firing_id: input.firing_id ?? null,
    cone: input.cone ?? null,
    atmosphere: input.atmosphere ?? null,
    application: input.application ?? null,
    result_rating: input.result_rating ?? null,
    result_tags: input.result_tags ?? [],
    notes: input.notes ?? null,
  };
  const { data, error } = await supabase.from('tests').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateTest(id: string, patch: UpdateTestPatch): Promise<Test> {
  const { data, error } = await supabase
    .from('tests')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTest(id: string): Promise<void> {
  const { error } = await supabase.from('tests').delete().eq('id', id);
  if (error) throw error;
}

/** Count of the signed-in user's tests (RLS scopes the count to them). */
export async function countMyTests(): Promise<number> {
  const { count, error } = await supabase
    .from('tests')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

/** Upload a photo file to the user's folder, then insert the test_photos row. */
export async function addPhoto(
  testId: string,
  userId: string,
  file: File,
  kind: PhotoKind,
  isCover: boolean,
): Promise<TestPhoto> {
  const path = buildPhotoPath(userId, testId, file);
  await uploadPhoto(path, file);
  const { data, error } = await supabase
    .from('test_photos')
    .insert({ test_id: testId, storage_path: path, kind, is_cover: isCover })
    .select('*')
    .single();
  if (error) {
    // Best-effort cleanup so we don't leave an orphaned object on a failed insert.
    await removePhoto(path).catch(() => undefined);
    throw error;
  }
  return data;
}

/** Remove a photo's storage object and its row. */
export async function removeTestPhoto(photo: TestPhoto): Promise<void> {
  const { error } = await supabase.from('test_photos').delete().eq('id', photo.id);
  if (error) throw error;
  await removePhoto(photo.storage_path).catch(() => undefined);
}
