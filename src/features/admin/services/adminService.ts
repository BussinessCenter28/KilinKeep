// Admin API. Calls the owner-verified admin-* Edge Functions. The frontend never
// queries admin data directly (RLS would scope it to the owner's own rows);
// authorization is enforced server-side against OWNER_USER_ID.
import { invokeFunction } from '@/lib/functions';

export interface AdminOverview {
  users: number;
  unlocked_users: number;
  free_users: number;
  tests: number;
  recipes: number;
  firings: number;
  revenue: number;
}

export interface AdminUser {
  user_id: string;
  plan: string;
  ai_credits: number;
  default_cone: string;
  units: string;
  created_at: string;
}

export interface AdminSales {
  total_revenue: number;
  by_type: Record<string, { count: number; total: number }>;
  recent: { type: string; amount: number; created_at: string }[];
}

export function getOverview(): Promise<AdminOverview> {
  return invokeFunction<AdminOverview>('admin-overview', {});
}

export function getUsers(before?: string): Promise<{ users: AdminUser[]; nextCursor: string | null }> {
  return invokeFunction<{ users: AdminUser[]; nextCursor: string | null }>(
    'admin-users',
    before ? { before } : {},
  );
}

export function getSales(): Promise<AdminSales> {
  return invokeFunction<AdminSales>('admin-sales', {});
}
