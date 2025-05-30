
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, invitationCode: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role from app_users table
          setTimeout(async () => {
            try {
              const { data: userData, error } = await supabase
                .from('app_users')
                .select('role')
                .eq('auth_user_id', session.user.id)
                .single();

              if (error) {
                console.error('Error fetching user role:', error);
                setUserRole(null);
              } else {
                setUserRole(userData?.role || null);
                console.log('User role set to:', userData?.role);
              }
            } catch (err) {
              console.error('Error in role fetch:', err);
              setUserRole(null);
            }
          }, 0);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // First check if user exists in app_users
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();

      if (appUserError || !appUser) {
        toast({
          title: "Σφάλμα",
          description: "Δεν βρέθηκε χρήστης με αυτό το email. Επικοινωνήστε με τον διαχειριστή.",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Σφάλμα σύνδεσης",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        // Update app_users with auth_user_id if not set
        if (!appUser.auth_user_id) {
          await supabase
            .from('app_users')
            .update({ auth_user_id: data.user.id })
            .eq('email', email);
        }

        toast({
          title: "Επιτυχής σύνδεση",
          description: "Καλώς ήρθατε!",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Σφάλμα",
        description: "Κάτι πήγε στραβά. Δοκιμάστε ξανά.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, invitationCode: string, fullName: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Check if user already exists in app_users
      const { data: existingUser } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();

      if (!existingUser) {
        toast({
          title: "Σφάλμα",
          description: "Δεν έχετε πρόσκληση για εγγραφή. Επικοινωνήστε με τον διαχειριστή.",
          variant: "destructive",
        });
        return false;
      }

      // If user exists but doesn't have auth_user_id, they can register
      if (existingUser.auth_user_id) {
        toast({
          title: "Σφάλμα",
          description: "Ο χρήστης έχει ήδη εγγραφεί. Δοκιμάστε να συνδεθείτε.",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        toast({
          title: "Σφάλμα εγγραφής",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        // Update app_users with auth_user_id
        await supabase
          .from('app_users')
          .update({ 
            auth_user_id: data.user.id,
            name: fullName 
          })
          .eq('email', email);

        toast({
          title: "Επιτυχής εγγραφή",
          description: "Ο λογαριασμός σας δημιουργήθηκε επιτυχώς!",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Σφάλμα",
        description: "Κάτι πήγε στραβά. Δοκιμάστε ξανά.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
      toast({
        title: "Αποσύνδεση",
        description: "Αποσυνδεθήκατε επιτυχώς.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποσύνδεση.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      signIn,
      signUp,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
