// Photo storage helpers. The `test-photos` bucket is PRIVATE, so reads use
// short-lived signed URLs created with the user's JWT (RLS scopes them to the
// user's own folder). Uploads write to "{user_id}/{test_id}/{uuid}.{ext}".

import { supabase } from './supabase';

const BUCKET = 'test-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot + 1) : 'jpg';
  return ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
}

/** Build the per-user object path. The first segment MUST be the user id (RLS). */
export function buildPhotoPath(userId: string, testId: string, file: File): string {
  const ext = fileExtension(file.name);
  // crypto.randomUUID is available in all modern browsers.
  return `${userId}/${testId}/${crypto.randomUUID()}.${ext}`;
}

export async function uploadPhoto(path: string, file: File): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return {};
  const out: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}

export async function removePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
