// Route guards. RequireAuth gates the app behind a session. RequireOwner hides the
// admin area in the UI — but note the REAL owner check is server-side in the admin
// Edge Functions; this is convenience only, never the security boundary.
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { env } from '@/lib/env';
import { Spinner } from '@/components/ui';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Loading…" />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequireOwner({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!env.ownerUserId || user?.id !== env.ownerUserId) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
