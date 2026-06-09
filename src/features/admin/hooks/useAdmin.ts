// Owner dashboard queries. retry:false so a not_configured/forbidden surfaces
// immediately rather than retrying.
import { useQuery } from '@tanstack/react-query';
import { getOverview, getSales, getUsers } from '../services/adminService';

export function useAdminOverview() {
  return useQuery({ queryKey: ['admin', 'overview'], queryFn: getOverview, retry: false });
}

export function useAdminSales() {
  return useQuery({ queryKey: ['admin', 'sales'], queryFn: getSales, retry: false });
}

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: () => getUsers(), retry: false });
}
