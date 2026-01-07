
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 useAuth: Setting up auth listener');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('🔧 useAuth: Initial session:', initialSession?.user?.id || 'No session');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('🔧 useAuth: Error getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔧 useAuth: Auth state changed:', event, session?.user?.id || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🔧 useAuth: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🔧 useAuth: Signing out');
    // Πρώτα καθαρίζουμε το local state
    setUser(null);
    setSession(null);
    setLoading(false);
    
    try {
      // Προσπαθούμε να κάνουμε signOut με scope: 'local' για να αποφύγουμε server errors
      await supabase.auth.signOut({ scope: 'local' });
      console.log('🔧 useAuth: SignOut completed');
    } catch (error) {
      console.error('🔧 useAuth: SignOut error (ignored):', error);
    }
  };

  console.log('🔧 useAuth: Current state:', { 
    userId: user?.id, 
    loading, 
    isAuthenticated: !!user 
  });

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};
