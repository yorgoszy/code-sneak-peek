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
import { useRoleCheck } from "@/hooks/useRoleCheck";
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
  const { userProfile, isCoach, isAdmin, loading: roleLoading } = useRoleCheck();

  // Check for password recovery tokens and redirect to reset password page
  useEffect(() => {
    const checkForRecoveryToken = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const searchParams = new URLSearchParams(search);

      // Supabase may redirect back using either:
      // - implicit flow: #access_token=...&type=recovery
      // - PKCE flow: ?code=...
      const isRecoveryFromHash = hash.includes('type=recovery') || hash.includes('type=magiclink');
      const hasAccessToken = hash.includes('access_token');
      const hasCode = searchParams.has('code');
      const hasToken = searchParams.has('token');
      const hasErrorDescription = hash.includes('error_description') || searchParams.has('error_description');

      console.log('🔐 Auth page - Checking for recovery:', {
        search,
        hash: hash.substring(0, 120),
        isRecoveryFromHash,
        hasAccessToken,
        hasCode,
      });

      // If there's a recovery signal, redirect to the reset password page
      if ((isRecoveryFromHash || hasAccessToken || hasCode || hasToken) && !hasErrorDescription) {
        console.log('🔐 Recovery detected, redirecting to /auth/reset-password');
        const suffix = `${search}${hash}`;
        navigate(`/auth/reset-password${suffix}`, { replace: true });
        return true;
      }

      return false;
    };
    
    // Check immediately
    const isRecovery = checkForRecoveryToken();
    
    // Only redirect if not a recovery and user is authenticated
    if (!isRecovery && !loading && !roleLoading && isAuthenticated && userProfile) {
      // Redirect based on role
      if (isCoach() && !isAdmin()) {
        console.log('🔐 Auth: Coach detected, redirecting to coach-overview');
        navigate("/dashboard/coach-overview", { replace: true });
      } else {
        console.log('🔐 Auth: Redirecting to dashboard');
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, loading, roleLoading, userProfile, isCoach, isAdmin, navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = signupPassword; // use controlled value
    const name = formData.get("name") as string;

    // Detailed password validation with specific messages
    const validatePassword = (pwd: string) => {
      const errors: string[] = [];
      if (pwd.length < 8) errors.push("τουλάχιστον 8 χαρακτήρες");
      const hasLower = /\p{Ll}/u.test(pwd); // Unicode lowercase (π.χ. α)
      const hasUpper = /\p{Lu}/u.test(pwd); // Unicode uppercase (π.χ. Α)
      const hasNumber = /\p{Nd}/u.test(pwd); // Unicode digits
      const hasSpecial = /[^\p{L}\p{N}]/u.test(pwd); // Anything that's not letter/number
      if (!hasLower) errors.push("μικρά γράμματα");
      if (!hasUpper) errors.push("κεφαλαία γράμματα");
      if (!hasNumber) errors.push("αριθμούς (0-9)");
      if (!hasSpecial) errors.push("ειδικούς χαρακτήρες (!@#$%^&*)");
      return errors;
    };

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      const msg = `Ο κωδικός πρέπει να περιέχει: ${passwordErrors.join(', ')}.`;
      setPasswordError(msg);
      toast({
        title: "Μη έγκυρος κωδικός",
        description: msg,
        variant: "destructive",
      });
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
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            name: name
          }
        }
      });

      console.log('📝 Supabase auth response:', { data, error });

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
          console.error('📝 Profile creation error:', profileError);
          toast({
            title: "Σφάλμα",
            description: `Προέκυψε σφάλμα κατά τη δημιουργία του προφίλ: ${profileError.message}`,
            variant: "destructive",
          });
        } else {
          console.log('📝 Profile created successfully');
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
        let errorMessage = "Παρουσιάστηκε πρόβλημα κατά τη σύνδεση.";
        
        if (error.message.includes('Invalid login credentials')) {
          // Ελέγχουμε αν ο χρήστης υπάρχει στη βάση
          const { data: userExists } = await supabase
            .from('app_users')
            .select('email, user_status')
            .eq('email', email)
            .single();
          
          if (userExists) {
            errorMessage = "Πιθανώς δεν έχετε επιβεβαιώσει το email σας. Ελέγξτε τα εισερχόμενά σας για το email επιβεβαίωσης. Αν δεν το βρίσκετε, επικοινωνήστε με τη διαχείριση.";
          } else {
            errorMessage = "Λάθος email ή κωδικός πρόσβασης.";
          }
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

      console.log('🔐 User profile found:', userProfile.user_status, 'role:', userProfile.role);

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

      // Determine redirect based on role
      const isCoach = userProfile.role === 'coach';
      const redirectPath = isCoach ? "/dashboard/coach-overview" : "/dashboard";
      
      console.log('🔐 Login successful, redirecting to:', redirectPath);
      
      toast({
        title: "Επιτυχία!",
        description: "Συνδεθήκατε επιτυχώς.",
      });

      navigate(redirectPath);
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
      const redirectUrl = 'https://www.hyperkids.gr/auth/reset-password';
      console.log('🔗 Password reset redirect URL:', redirectUrl);
      
      // Use our custom edge function instead of Supabase built-in
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: email,
          redirectTo: redirectUrl,
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
      <div className="min-h-screen bg-[hsl(var(--auth-black))] flex items-center justify-center">
        <div className="text-center">
          <img src="/assets/hyperkids-auth-logo.png" alt="HYPERKIDS" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-[hsl(var(--auth-gray))]">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--auth-black))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center">
            <img src="/assets/hyperkids-auth-logo.png" alt="HYPERKIDS" className="h-16" />
          </Link>
        </div>

        <Card className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))]">
          <CardHeader>
            <CardTitle className="text-center text-[hsl(var(--auth-gray))]">
              {showForgotPassword ? "Επαναφορά Κωδικού" : "Είσοδος στο λογαριασμό σας"}
            </CardTitle>
            <CardDescription className="text-center text-[hsl(var(--auth-gray))]">
              {showForgotPassword ? "Εισάγετε το email σας για επαναφορά κωδικού" : "Συνδεθείτε για να συνεχίσετε"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-[hsl(var(--auth-gray))]">Email</Label>
                  <Input 
                    id="reset-email" 
                    name="reset-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                    className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-[hsl(var(--auth-gray))] placeholder:text-[hsl(var(--auth-gray)/0.6)]"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-none bg-[#cb8954] text-black hover:bg-[#cb8954]/90 border-2 border-transparent transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? "Αποστολή..." : "Αποστολή Email Επαναφοράς"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full rounded-none border-[hsl(var(--auth-gray))] text-[hsl(var(--auth-gray))] hover:bg-[hsl(var(--auth-gray)/0.1)]"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Επιστροφή στη Σύνδεση
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[hsl(var(--auth-black))] border border-[hsl(var(--auth-gray))]">
                  <TabsTrigger value="login" className="text-[hsl(var(--auth-gray))] data-[state=active]:bg-[hsl(var(--auth-gray))] data-[state=active]:text-black">Σύνδεση</TabsTrigger>
                  <TabsTrigger value="signup" className="text-[hsl(var(--auth-gray))] data-[state=active]:bg-[hsl(var(--auth-gray))] data-[state=active]:text-black">Εγγραφή</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[hsl(var(--auth-gray))]">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="your@email.com" required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-[hsl(var(--auth-gray))] placeholder:text-[hsl(var(--auth-gray)/0.6)]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[hsl(var(--auth-gray))]">Κωδικός</Label>
                      <Input id="password" name="password" type="password" required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-[hsl(var(--auth-gray))] placeholder:text-[hsl(var(--auth-gray)/0.6)]" />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full rounded-none bg-[#cb8954] text-black hover:bg-[#cb8954]/90 border-2 border-transparent transition-all duration-300" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Σύνδεση..." : "Σύνδεση"}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-[#cb8954] hover:underline"
                      >
                        Ξέχασα τον κωδικό μου
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[hsl(var(--auth-gray))]">Πλήρες Όνομα</Label>
                      <Input id="name" name="name" type="text" placeholder="Το όνομά σας" required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-[hsl(var(--auth-gray))] placeholder:text-[hsl(var(--auth-gray)/0.6)]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-[hsl(var(--auth-gray))]">Email</Label>
                      <Input id="signup-email" name="signup-email" type="email" placeholder="your@email.com" required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-[hsl(var(--auth-gray))] placeholder:text-[hsl(var(--auth-gray)/0.6)]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-[hsl(var(--auth-gray))]">Κωδικός</Label>
                      <Input
                        id="signup-password"
                        name="signup-password"
                        type="password"
                        required
                        minLength={8}
                        value={signupPassword}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSignupPassword(val);
                          // Unicode-aware validation (Greek, Latin, etc.)
                          const hasLower = /\p{Ll}/u.test(val);
                          const hasUpper = /\p{Lu}/u.test(val);
                          const hasNumber = /\p{Nd}/u.test(val);
                          const hasSpecial = /[^\p{L}\p{N}]/u.test(val);
                          const errors: string[] = [];
                          if (val.length < 8) errors.push("τουλάχιστον 8 χαρακτήρες");
                          if (!hasLower) errors.push("μικρά γράμματα");
                          if (!hasUpper) errors.push("κεφαλαία γράμματα");
                          if (!hasNumber) errors.push("αριθμούς");
                          if (!hasSpecial) errors.push("ειδικούς χαρακτήρες");
                          setPasswordError(errors.length ? `Ο κωδικός πρέπει να περιέχει: ${errors.join(', ')}.` : null);
                        }}
                        aria-invalid={!!passwordError}
                        aria-describedby="password-help"
                        className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-[hsl(var(--auth-gray))] placeholder:text-[hsl(var(--auth-gray)/0.6)]"
                      />
                      <p id="password-help" className={`text-xs ${passwordError ? 'text-red-600' : 'text-[hsl(var(--auth-gray))]'}`}>
                        Τουλάχιστον 8 χαρακτήρες με κεφαλαία/μικρά (οποιασδήποτε γλώσσας), αριθμούς και σύμβολα.
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full rounded-none bg-[#cb8954] text-black hover:bg-[#cb8954]/90 border-2 border-transparent transition-all duration-300" 
                      disabled={isLoading || !!passwordError || signupPassword.length === 0}
                    >
                      {isLoading ? "Εγγραφή..." : "Εγγραφή"}
                    </Button>
                    <div className="text-xs text-[hsl(var(--auth-gray))] text-center">
                      Μετά την εγγραφή, μπορείτε να συνδεθείτε αμέσως.
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            )}


            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-[#cb8954] hover:underline">
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
