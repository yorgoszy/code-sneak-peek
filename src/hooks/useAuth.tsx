
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

    // Πρώτα καθαρίζουμε το local state (ώστε να μην “κολλάει” το UI)
    setUser(null);
    setSession(null);
    setLoading(false);

    // Fallback καθαρισμός storage για περιπτώσεις "session_not_found" (403)
    const clearAuthStorage = () => {
      try {
        // Supabase-js αποθηκεύει session σε key τύπου: sb-<project-ref>-auth-token
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }

        // Σε κάποια περιβάλλοντα μπορεί να γράφονται και σε sessionStorage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (!key) continue;
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            sessionStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('🔧 useAuth: Storage clear warning:', e);
      }
    };

    try {
      // Προσπαθούμε local sign out (δεν μας νοιάζει αν ο server πει session_not_found)
      await supabase.auth.signOut({ scope: 'local' });
      console.log('🔧 useAuth: SignOut completed');
    } catch (error) {
      console.error('🔧 useAuth: SignOut error (ignored):', error);
    } finally {
      clearAuthStorage();
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
