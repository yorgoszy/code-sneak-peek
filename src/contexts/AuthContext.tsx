import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'coach' | 'trainer' | 'athlete' | 'general' | 'parent' | 'federation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRoles: UserRole[];
  userProfile: any;
  rolesLoading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isCoach: () => boolean;
  isTrainer: () => boolean;
  isAthlete: () => boolean;
  isGeneral: () => boolean;
  isParent: () => boolean;
  isFederation: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [initializedAuth, setInitializedAuth] = useState(false);
  const [initializedRoles, setInitializedRoles] = useState(false);

  // Fetch user profile/roles from app_users table
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ AuthContext: Error fetching user profile:', error);
        setUserRoles([]);
        setUserProfile(null);
      } else if (profile) {
        setUserProfile(profile);
        setUserRoles([profile.role as UserRole]);
      } else {
        setUserRoles([]);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('💥 AuthContext: Error in fetchUserRole:', error);
      setUserRoles([]);
      setUserProfile(null);
    } finally {
      setRolesLoading(false);
      setInitializedRoles(true);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
        setInitializedAuth(true);

        if (initialSession?.user?.id) {
          fetchUserRole(initialSession.user.id);
        } else {
          setRolesLoading(false);
          setInitializedRoles(true);
        }
      } catch (error) {
        console.error('AuthContext: Error getting initial session:', error);
        setLoading(false);
        setRolesLoading(false);
        setInitializedAuth(true);
        setInitializedRoles(true);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && newSession?.user?.id) {
          // Only show loading on fresh sign in
          setRolesLoading(true);
          fetchUserRole(newSession.user.id);
        } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && newSession?.user?.id) {
          // Silent re-fetch — DO NOT toggle rolesLoading, otherwise pages
          // that gate rendering on rolesLoading will unmount and appear to "reload"
          // every time Supabase auto-refreshes the token.
          fetchUserRole(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUserRoles([]);
          setUserProfile(null);
          setRolesLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  // Keep role/profile in sync when app_users row changes or tab regains focus
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`app-users-role-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_users',
          filter: `auth_user_id=eq.${user.id}`,
        },
        () => {
          // Silent re-fetch on app_users row change
          fetchUserRole(user.id);
        }
      )
      .subscribe();

    const handleWindowFocus = () => {
      // Silent re-fetch on focus — do not toggle rolesLoading
      fetchUserRole(user.id);
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUserRole]);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setUserRoles([]);
    setUserProfile(null);
    setLoading(false);
    setRolesLoading(false);

    const clearAuthStorage = () => {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (!key) continue;
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            sessionStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('AuthContext: Storage clear warning:', e);
      }
    };

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('AuthContext: SignOut error (ignored):', error);
    } finally {
      clearAuthStorage();
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!user?.id) return;
    setRolesLoading(true);
    await fetchUserRole(user.id);
  }, [user?.id, fetchUserRole]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return userRoles.includes(role);
  }, [userRoles]);

  const isAdmin = useCallback((): boolean => userRoles.includes('admin'), [userRoles]);
  const isCoach = useCallback((): boolean => userRoles.includes('coach'), [userRoles]);
  const isTrainer = useCallback((): boolean => userRoles.includes('trainer'), [userRoles]);
  const isAthlete = useCallback((): boolean => userRoles.includes('athlete'), [userRoles]);
  const isGeneral = useCallback((): boolean => userRoles.includes('general'), [userRoles]);
  const isParent = useCallback((): boolean => userRoles.includes('parent'), [userRoles]);
  const isFederation = useCallback((): boolean => userRoles.includes('federation'), [userRoles]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading: loading || !initializedAuth,
    userRoles,
    userProfile,
    rolesLoading: rolesLoading || !initializedRoles,
    signOut,
    refreshUserProfile,
    isAuthenticated: !!user,
    hasRole,
    isAdmin,
    isCoach,
    isTrainer,
    isAthlete,
    isGeneral,
    isParent,
    isFederation,
  }), [
    user,
    session,
    loading,
    initializedAuth,
    userRoles,
    userProfile,
    rolesLoading,
    initializedRoles,
    signOut,
    refreshUserProfile,
    hasRole,
    isAdmin,
    isCoach,
    isTrainer,
    isAthlete,
    isGeneral,
    isParent,
    isFederation,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
