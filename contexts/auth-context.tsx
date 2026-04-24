import { Session, User } from '@supabase/supabase-js';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { Profile } from '@/data/types';
import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile } from '@/services/profile';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | null | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const result = await getCurrentUserProfile();
      setProfile(result);
    } catch {
      // Profile fetch failure should not break auth — degrade to null
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Initial session + profile
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s);
      await loadProfile(s?.user?.id);
      setIsLoading(false);
    });

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      await loadProfile(s?.user?.id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user?.id);
  }, [loadProfile, session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.role === 'admin',
    isLoading,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
