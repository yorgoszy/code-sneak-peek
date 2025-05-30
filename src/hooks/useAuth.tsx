
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, invitationCode: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role
          setTimeout(async () => {
            try {
              const { data: roleData } = await supabase
                .rpc('get_user_role', { _user_id: session.user.id });
              setUserRole(roleData);
            } catch (error) {
              console.error('Error fetching user role:', error);
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

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Επιτυχής σύνδεση",
        description: "Καλώς ήρθατε!",
      });
    } catch (error: any) {
      toast({
        title: "Σφάλμα σύνδεσης",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, invitationCode: string) => {
    try {
      // First, verify the invitation code
      const { data: codeData, error: codeError } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', invitationCode)
        .eq('is_used', false)
        .single();

      if (codeError || !codeData) {
        throw new Error('Μη έγκυρος κωδικός πρόσκλησης');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Mark invitation code as used
        await supabase
          .from('invitation_codes')
          .update({ 
            is_used: true, 
            used_by: data.user.id,
            used_at: new Date().toISOString()
          })
          .eq('id', codeData.id);

        // Assign role to user
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: codeData.role,
          });

        // Update app_users table
        await supabase
          .from('app_users')
          .upsert({
            auth_user_id: data.user.id,
            email: email,
            name: fullName,
            role: codeData.role,
          });
      }

      toast({
        title: "Επιτυχής εγγραφή",
        description: "Ο λογαριασμός σας δημιουργήθηκε!",
      });
    } catch (error: any) {
      toast({
        title: "Σφάλμα εγγραφής",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Αποσύνδεση",
        description: "Αποσυνδεθήκατε επιτυχώς",
      });
    } catch (error: any) {
      toast({
        title: "Σφάλμα αποσύνδεσης",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
