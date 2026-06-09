// Resolve private storage paths to short-lived signed URLs (cached by TanStack Query).
// Reads go through the shared storage lib (not the supabase client directly).
import { useQuery } from '@tanstack/react-query';
import { getSignedUrl, getSignedUrls } from '@/lib/storage';

/** One signed URL for a single path (e.g. a card cover thumb). */
export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', path ?? null],
    queryFn: () => getSignedUrl(path as string),
    enabled: !!path,
    staleTime: 50 * 60_000,
  });
}

/** A map of path → signed URL for a gallery. */
export function useSignedUrls(paths: string[]) {
  const key = [...paths].sort();
  return useQuery({
    queryKey: ['signed-urls', key],
    queryFn: () => getSignedUrls(paths),
    enabled: paths.length > 0,
    staleTime: 50 * 60_000,
  });
}
