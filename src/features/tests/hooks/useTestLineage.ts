// Ancestry + direct children of a test, for the LineageStrip.
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { getLineage } from '../services/testService';

export function useTestLineage(id: string | undefined) {
  return useQuery({
    queryKey: qk.testLineage(id ?? ''),
    queryFn: () => getLineage(id as string),
    enabled: !!id,
  });
}
