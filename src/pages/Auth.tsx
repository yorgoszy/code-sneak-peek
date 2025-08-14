import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResettingPasswords, setIsResettingPasswords] = useState(false);
  const [signupPassword, setSignupPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = signupPassword; // use controlled value
    const name = formData.get("name") as string;

    // Client-side strong password validation
    const isStrongPassword = (pwd: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
    if (!isStrongPassword(password)) {
      const msg = "Ο κωδικός πρέπει να έχει ≥8 χαρακτήρες και να περιέχει κεφαλαία, μικρά, αριθμούς και σύμβολα.";
      setPasswordError(msg);
      setIsLoading(false);
      return;
    }

    try {
      console.log('📝 Sign up start for:', email);
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: name
          }
        }
      });

      if (error) {
        // Έλεγχος για ήδη εγγεγραμμένο email
        if (error.message.includes('User already registered')) {
          toast({
            title: "Το email υπάρχει ήδη",
            description: "Υπάρχει ήδη εγγεγραμμένος χρήστης με αυτό το email. Δοκιμάστε να συνδεθείτε ή χρησιμοποιήστε άλλο email.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw error;
      }

      if (data.user) {
        console.log('📝 Creating app_users profile for:', data.user.id);
        // Create user profile in app_users table - now automatically active and general
        const { error: profileError } = await supabase
          .from('app_users')
          .insert({
            auth_user_id: data.user.id,
            name: name,
            email: email,
            role: 'general', // Always general by default
            user_status: 'active' // Always active by default
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast({
            title: "Σφάλμα",
            description: "Προέκυψε σφάλμα κατά τη δημιουργία του προφίλ.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Εγγραφή ολοκληρώθηκε!",
            description: "Ελέγξτε το email σας για επιβεβαίωση. Μπορείτε να συνδεθείτε αμέσως.",
          });
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Σφάλμα",
        description: error.message || "Παρουσιάστηκε σφάλμα κατά την εγγραφή.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('🔐 Auth error:', error);
        
        // Βελτιωμένα μηνύματα σφάλματος
        let errorMessage = "Λάθος email ή κωδικός πρόσβασης.";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Λάθος κωδικός πρόσβασης. Παρακαλώ δοκιμάστε ξανά.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Πρέπει να επιβεβαιώσετε το email σας πρώτα. Ελέγξτε τα εισερχόμενά σας.";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Πολλές προσπάθειες σύνδεσης. Δοκιμάστε ξανά σε λίγα λεπτά.";
        }
        
        throw new Error(errorMessage);
      }

      console.log('🔐 Auth successful, checking user profile for:', data.user.id);

      // Check if user has an app_users profile
      const { data: userProfile, error: profileError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (profileError) {
        console.error('🔐 Profile fetch error:', profileError);
        
        if (profileError.code === 'PGRST116') {
          toast({
            title: "Πρόβλημα με το προφίλ",
            description: "Δεν βρέθηκε το προφίλ χρήστη. Επικοινωνήστε με έναν διαχειριστή.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Σφάλμα βάσης δεδομένων",
            description: "Πρόβλημα κατά την ανάκτηση του προφίλ. Δοκιμάστε ξανά.",
            variant: "destructive",
          });
        }
        await supabase.auth.signOut();
        return;
      }

      if (!userProfile) {
        console.error('🔐 No user profile found for:', data.user.id);
        toast({
          title: "Λογαριασμός μη ενεργοποιημένος",
          description: "Ο λογαριασμός σας δεν έχει ενεργοποιηθεί ακόμη. Επικοινωνήστε με έναν διαχειριστή.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      console.log('🔐 User profile found:', userProfile.user_status);

      if (userProfile.user_status !== 'active') {
        const statusMessage = userProfile.user_status === 'pending' 
          ? "Ο λογαριασμός σας εκκρεμεί έγκριση από έναν διαχειριστή." 
          : "Ο λογαριασμός σας δεν είναι ενεργός.";
          
        toast({
          title: "Λογαριασμός μη ενεργοποιημένος",
          description: statusMessage + " Επικοινωνήστε με έναν διαχειριστή.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      console.log('🔐 Login successful, redirecting to dashboard');
      
      toast({
        title: "Επιτυχία!",
        description: "Συνδεθήκατε επιτυχώς.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error('🔐 Login process error:', error);
      toast({
        title: "Σφάλμα σύνδεσης",
        description: error.message || "Υπήρξε πρόβλημα κατά τη σύνδεση. Δοκιμάστε ξανά.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;

    try {
      // Use our custom edge function instead of Supabase built-in
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: email,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      });

      if (error) throw error;

      toast({
        title: "Email στάλθηκε!",
        description: "Ελέγξτε το email σας για οδηγίες επαναφοράς κωδικού.",
      });

      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Σφάλμα",
        description: error.message || "Παρουσιάστηκε σφάλμα κατά την επαναφορά κωδικού.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAllPasswords = async () => {
    setIsResettingPasswords(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('reset-all-passwords', {
        body: {
          adminKey: 'HYPERKIDS_ADMIN_RESET_2025'
        }
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: `Επαναφορά ολοκληρώθηκε! ${data.successful}/${data.total} χρήστες.`,
      });
    } catch (error: any) {
      console.error('Reset all passwords error:', error);
      toast({
        title: "Σφάλμα",
        description: error.message || "Παρουσιάστηκε σφάλμα κατά την επαναφορά.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPasswords(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/lovable-uploads/bafc2832-366b-43ee-a1c6-3e3ea94f5dbb.png" alt="HYPERKIDS" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center">
            <img src="/lovable-uploads/bafc2832-366b-43ee-a1c6-3e3ea94f5dbb.png" alt="HYPERKIDS" className="h-16" />
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {showForgotPassword ? "Επαναφορά Κωδικού" : "Είσοδος στο λογαριασμό σας"}
            </CardTitle>
            <CardDescription className="text-center">
              {showForgotPassword ? "Εισάγετε το email σας για επαναφορά κωδικού" : "Συνδεθείτε για να συνεχίσετε"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input 
                    id="reset-email" 
                    name="reset-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-none bg-[#00ffba] text-black hover:bg-[#00cc95] border-2 border-transparent transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? "Αποστολή..." : "Αποστολή Email Επαναφοράς"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full rounded-none"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Επιστροφή στη Σύνδεση
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Σύνδεση</TabsTrigger>
                  <TabsTrigger value="signup">Εγγραφή</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="your@email.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Κωδικός</Label>
                      <Input id="password" name="password" type="password" required />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full rounded-none bg-[#00ffba] text-black hover:bg-[#00cc95] border-2 border-transparent transition-all duration-300" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Σύνδεση..." : "Σύνδεση"}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Ξέχασα τον κωδικό μου
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Πλήρες Όνομα</Label>
                      <Input id="name" name="name" type="text" placeholder="Το όνομά σας" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" name="signup-email" type="email" placeholder="your@email.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Κωδικός</Label>
                      <Input
                        id="signup-password"
                        name="signup-password"
                        type="password"
                        required
                        minLength={8}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$"
                        value={signupPassword}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSignupPassword(val);
                          const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(val);
                          setPasswordError(
                            strong
                              ? null
                              : "Ο κωδικός πρέπει να έχει ≥8 χαρακτήρες και να περιέχει κεφαλαία, μικρά, αριθμούς και σύμβολα."
                          );
                        }}
                        aria-invalid={!!passwordError}
                        aria-describedby="password-help"
                      />
                      <p id="password-help" className={`text-xs ${passwordError ? 'text-red-600' : 'text-gray-500'}`}>
                        Τουλάχιστον 8 χαρακτήρες με κεφαλαία, μικρά, αριθμούς και σύμβολα.
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full rounded-none bg-[#00ffba] text-black hover:bg-[#00cc95] border-2 border-transparent transition-all duration-300" 
                      disabled={isLoading || !!passwordError || signupPassword.length === 0}
                    >
                      {isLoading ? "Εγγραφή..." : "Εγγραφή"}
                    </Button>
                    <div className="text-xs text-gray-600 text-center">
                      Μετά την εγγραφή, μπορείτε να συνδεθείτε αμέσως.
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            )}


            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-blue-600 hover:underline">
                ← Επιστροφή στην αρχική
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
