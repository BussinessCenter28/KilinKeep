// Paginated list of tests. Wraps useInfiniteQuery so the page gets keyset "Load more"
// for free. Filters become part of the query key so changing them refetches cleanly.
import { useInfiniteQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { listTests, type ListTestsResult, type TestCursor } from '../services/testService';

const PAGE_SIZE = 20;

export interface TestFilters {
  search?: string;
  tag?: string;
  minRating?: number;
}

export function useTests(filters: TestFilters = {}) {
  return useInfiniteQuery<ListTestsResult>({
    queryKey: qk.tests(filters),
    initialPageParam: null as TestCursor | null,
    queryFn: ({ pageParam }) =>
      listTests({
        limit: PAGE_SIZE,
        cursor: (pageParam as TestCursor | null) ?? undefined,
        search: filters.search,
        tag: filters.tag,
        minRating: filters.minRating,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
