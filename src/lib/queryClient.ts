import { QueryClient } from '@tanstack/react-query';

// Server-state cache. Sensible defaults for a mobile app on flaky studio wifi.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Centralized query keys so cache invalidation stays consistent across features.
export const qk = {
  profile: ['profile'] as const,
  tests: (filters?: unknown) => ['tests', filters ?? null] as const,
  test: (id: string) => ['test', id] as const,
  testLineage: (id: string) => ['test', id, 'lineage'] as const,
  recipes: ['recipes'] as const,
  recipe: (id: string) => ['recipe', id] as const,
  firings: ['firings'] as const,
  firing: (id: string) => ['firing', id] as const,
};
