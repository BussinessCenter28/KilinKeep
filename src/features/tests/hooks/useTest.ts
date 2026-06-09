// Single test detail (with joined recipe/firing/photos).
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { getTest } from '../services/testService';

export function useTest(id: string | undefined) {
  return useQuery({
    queryKey: qk.test(id ?? ''),
    queryFn: () => getTest(id as string),
    enabled: !!id,
  });
}
