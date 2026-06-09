// Read hooks for firings. Components consume these; they never touch services directly.
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { listFirings, getFiring } from '../services/firingService';

export function useFirings() {
  return useQuery({
    queryKey: qk.firings,
    queryFn: listFirings,
  });
}

export function useFiring(id: string | undefined) {
  return useQuery({
    queryKey: qk.firing(id ?? ''),
    queryFn: () => getFiring(id as string),
    enabled: !!id,
  });
}
