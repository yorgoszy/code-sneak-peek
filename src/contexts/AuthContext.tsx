import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'coach' | 'trainer' | 'athlete' | 'general' | 'parent';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRoles: UserRole[];
  userProfile: any;
  rolesLoading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isCoach: () => boolean;
  isTrainer: () => boolean;
  isAthlete: () => boolean;
  isGeneral: () => boolean;
  isParent: () => boolean;
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
          // Re-fetch roles on sign in
          setRolesLoading(true);
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

  const hasRole = useCallback((role: UserRole): boolean => {
    return userRoles.includes(role);
  }, [userRoles]);

  const isAdmin = useCallback((): boolean => userRoles.includes('admin'), [userRoles]);
  const isCoach = useCallback((): boolean => userRoles.includes('coach'), [userRoles]);
  const isTrainer = useCallback((): boolean => userRoles.includes('trainer'), [userRoles]);
  const isAthlete = useCallback((): boolean => userRoles.includes('athlete'), [userRoles]);
  const isGeneral = useCallback((): boolean => userRoles.includes('general'), [userRoles]);
  const isParent = useCallback((): boolean => userRoles.includes('parent'), [userRoles]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading: loading || !initializedAuth,
    userRoles,
    userProfile,
    rolesLoading: rolesLoading || !initializedRoles,
    signOut,
    isAuthenticated: !!user,
    hasRole,
    isAdmin,
    isCoach,
    isTrainer,
    isAthlete,
    isGeneral,
    isParent,
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
    hasRole,
    isAdmin,
    isCoach,
    isTrainer,
    isAthlete,
    isGeneral,
    isParent,
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
