// App-wide auth + profile context. Small and justified (needed everywhere). The
// profile carries plan/ai_credits used for gating; it is the SERVER's value (RLS),
// never client-trusted for security — only for showing/hiding UI.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { fetchProfile } from './services/authService';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isUnlocked: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = session?.user.id ?? null;

  async function loadProfile(id: string | null) {
    if (!id) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await fetchProfile(id));
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Reload the profile whenever the user changes.
  useEffect(() => {
    void loadProfile(userId);
  }, [userId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isUnlocked: profile?.plan === 'unlocked',
      refreshProfile: () => loadProfile(userId),
    }),
    [session, profile, loading, userId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
