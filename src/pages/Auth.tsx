import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useTranslations } from "@/hooks/useTranslations";
import { useEffect } from "react";
import { Globe } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResettingPasswords, setIsResettingPasswords] = useState(false);
  const [signupPassword, setSignupPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [coachSignupPassword, setCoachSignupPassword] = useState("");
  const [coachPasswordError, setCoachPasswordError] = useState<string | null>(null);
  const [signupFeedback, setSignupFeedback] = useState<
    | { variant: "default" | "destructive"; title: string; description?: string }
    | null
  >(null);
  const [coachSignupFeedback, setCoachSignupFeedback] = useState<
    | { variant: "default" | "destructive"; title: string; description?: string }
    | null
  >(null);
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'coach-signup'>('login');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, loading } = useAuth();
  const { userProfile, isCoach, isAdmin, loading: roleLoading } = useRoleCheck();
  
  // Get language from URL or use translations hook
  const { language, translations: t, toggleLanguage } = useTranslations();
  
  // Sync language from URL param (from landing page)
  useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam === 'en' && language === 'el') {
      toggleLanguage();
    } else if (langParam === 'el' && language === 'en') {
      toggleLanguage();
    }
  }, [searchParams]);

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
        console.log('🔐 Recovery detected, redirecting to /reset-password');
        const suffix = `${search}${hash}`;
        navigate(`/reset-password${suffix}`, { replace: true });
        return true;
      }

      return false;
    };
    
    // Check immediately
    const isRecovery = checkForRecoveryToken();
    
    // Only redirect if not a recovery and user is authenticated
    if (!isRecovery && !loading && !roleLoading && isAuthenticated && userProfile) {
      // Save language preference to localStorage before redirect
      localStorage.setItem('preferredLanguage', language);
      
      // Redirect based on role
      if (isCoach() && !isAdmin()) {
        console.log('🔐 Auth: Coach detected, redirecting to coach-overview');
        navigate("/dashboard/coach-overview", { replace: true });
      } else {
        console.log('🔐 Auth: Redirecting to dashboard');
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, loading, roleLoading, userProfile, isCoach, isAdmin, navigate, language]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupFeedback(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = signupPassword; // use controlled value
    const name = formData.get("name") as string;

    // Detailed password validation with specific messages (no Unicode property escapes for wider browser support)
    const validatePassword = (pwd: string) => {
      const errors: string[] = [];
      if (pwd.length < 8) errors.push(t.authPasswordMinChars);

      // Support Greek + Latin letters without using \p{...} (some browsers don't support it)
      const lowerRe = /[a-zα-ωάέήίόύώϊϋΐΰ]/;
      const upperRe = /[A-ZΑ-ΩΆΈΉΊΌΎΏΪΫ]/;
      const numberRe = /[0-9]/;
      const specialRe = /[^A-Za-z0-9Α-ΩΆΈΉΊΌΎΏΪΫα-ωάέήίόύώϊϋΐΰ]/;

      const hasLower = lowerRe.test(pwd);
      const hasUpper = upperRe.test(pwd);
      const hasNumber = numberRe.test(pwd);
      const hasSpecial = specialRe.test(pwd);

      if (!hasLower) errors.push(t.authPasswordLowercase);
      if (!hasUpper) errors.push(t.authPasswordUppercase);
      if (!hasNumber) errors.push(t.authPasswordNumbers);
      if (!hasSpecial) errors.push(t.authPasswordSpecial);
      return errors;
    };

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      const msg = `${t.authPasswordRequirements} ${passwordErrors.join(', ')}.`;
      setPasswordError(msg);
      setSignupFeedback({ variant: "destructive", title: t.authErrorInvalidPassword, description: msg });
      toast({
        title: t.authErrorInvalidPassword,
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
        console.error('📝 Signup error:', error.message, error.status);
        
        // Αναλυτικά μηνύματα σφάλματος
        let errorTitle = t.authErrorGeneric;
        let errorDescription = t.authErrorGenericDesc;
        
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('already exists')) {
          errorTitle = t.authErrorEmailExists;
          errorDescription = t.authErrorEmailExistsDesc;
        } else if (error.message.includes('Password should be at least') || 
                   error.message.includes('password') ||
                   error.message.includes('weak')) {
          errorTitle = t.authErrorWeakPassword;
          errorDescription = t.authErrorWeakPasswordDesc;
        } else if (error.message.includes('Invalid email') || 
                   error.message.includes('valid email')) {
          errorTitle = t.authErrorInvalidEmail;
          errorDescription = t.authErrorInvalidEmailDesc;
        } else if (error.message.includes('rate limit') || 
                   error.message.includes('too many requests') ||
                   error.message.includes('Too many')) {
          errorTitle = t.authErrorTooManyRequests;
          errorDescription = t.authErrorTooManyRequestsDesc;
        } else if (error.message.includes('network') || 
                   error.message.includes('connection')) {
          errorTitle = t.authErrorConnection;
          errorDescription = t.authErrorConnectionDesc;
        } else {
          // Γενικό σφάλμα με το πραγματικό μήνυμα
          errorDescription = error.message || t.authErrorGenericDesc;
        }
        
        setSignupFeedback({
          variant: "destructive",
          title: errorTitle,
          description: errorDescription,
        });
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // ΣΗΜΑΝΤΙΚΟ: Η Supabase επιστρέφει επιτυχία (status 200) ακόμα και αν ο χρήστης υπάρχει ήδη!
      // Πρέπει να ελέγξουμε αν ο χρήστης δημιουργήθηκε πραγματικά
      if (data.user) {
        // Έλεγχος αν είναι fake success (user_repeated_signup)
        // Αν δεν υπάρχει identities ή είναι άδειο, ο χρήστης υπάρχει ήδη
        const isExistingUser = !data.user.identities || data.user.identities.length === 0;
        
        if (isExistingUser) {
          console.log('📝 User already exists (fake success):', email);
          const feedback = {
            variant: "destructive" as const,
            title: t.authErrorEmailExists,
            description: t.authErrorEmailExistsDesc,
          };
          setSignupFeedback(feedback);
          toast({
            title: feedback.title,
            description: feedback.description,
            variant: feedback.variant,
          });
          setIsLoading(false);
          return;
        }

        console.log('📝 New user created, profile will be created by trigger:', data.user.id);
        const okFeedback = {
          variant: "default" as const,
          title: t.authSuccessSignup,
          description: t.authSuccessSignupDesc,
        };
        setSignupFeedback(okFeedback);
        toast({
          title: okFeedback.title,
          description: okFeedback.description,
        });
      } else {
        // Δεν δημιουργήθηκε χρήστης χωρίς error - πιθανώς υπάρχει ήδη
        console.log('📝 No user returned, likely already exists');
        const failFeedback = {
          variant: "destructive" as const,
          title: t.authErrorSignupProblem,
          description: t.authErrorSignupProblemDesc,
        };
        setSignupFeedback(failFeedback);
        toast({
          title: failFeedback.title,
          description: failFeedback.description,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setSignupFeedback({
        variant: "destructive",
        title: t.authError,
        description: error.message || t.authErrorGenericDesc,
      });
      toast({
        title: t.authError,
        description: error.message || t.authErrorGenericDesc,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoachSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setCoachSignupFeedback(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("coach-email") as string;
    const password = coachSignupPassword;
    const name = formData.get("coach-name") as string;

    // Password validation
    const validatePassword = (pwd: string) => {
      const errors: string[] = [];
      if (pwd.length < 8) errors.push(t.authPasswordMinChars);

      const lowerRe = /[a-zα-ωάέήίόύώϊϋΐΰ]/;
      const upperRe = /[A-ZΑ-ΩΆΈΉΊΌΎΏΪΫ]/;
      const numberRe = /[0-9]/;
      const specialRe = /[^A-Za-z0-9Α-ΩΆΈΉΊΌΎΏΪΫα-ωάέήίόύώϊϋΐΰ]/;

      if (!lowerRe.test(pwd)) errors.push(t.authPasswordLowercase);
      if (!upperRe.test(pwd)) errors.push(t.authPasswordUppercase);
      if (!numberRe.test(pwd)) errors.push(language === 'el' ? "αριθμούς" : "numbers");
      if (!specialRe.test(pwd)) errors.push(language === 'el' ? "ειδικούς χαρακτήρες" : "special characters");
      return errors;
    };

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      const msg = `${t.authPasswordRequirements} ${passwordErrors.join(', ')}.`;
      setCoachPasswordError(msg);
      setCoachSignupFeedback({ variant: "destructive", title: t.authErrorInvalidPassword, description: msg });
      toast({
        title: t.authErrorInvalidPassword,
        description: msg,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('📝 Coach sign up start for:', email);
      
      // Create user with role: coach in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            name: name,
            role: 'coach'  // This will be picked up by the database trigger
          }
        }
      });

      console.log('📝 Supabase auth response:', { data, error });

      if (error) {
        console.error('📝 Coach signup error:', error.message, error.status);
        
        let errorTitle = t.authErrorGeneric;
        let errorDescription = t.authErrorGenericDesc;
        
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('already exists')) {
          errorTitle = t.authErrorEmailExists;
          errorDescription = t.authErrorEmailExistsDesc;
        } else if (error.message.includes('Password should be at least') || 
                   error.message.includes('password') ||
                   error.message.includes('weak')) {
          errorTitle = t.authErrorWeakPassword;
          errorDescription = t.authErrorWeakPasswordDesc;
        } else if (error.message.includes('Invalid email') || 
                   error.message.includes('valid email')) {
          errorTitle = t.authErrorInvalidEmail;
          errorDescription = t.authErrorInvalidEmailDesc;
        } else if (error.message.includes('rate limit') || 
                   error.message.includes('too many requests') ||
                   error.message.includes('Too many')) {
          errorTitle = t.authErrorTooManyRequests;
          errorDescription = t.authErrorTooManyRequestsDesc;
        } else if (error.message.includes('network') || 
                   error.message.includes('connection')) {
          errorTitle = t.authErrorConnection;
          errorDescription = t.authErrorConnectionDesc;
        } else {
          errorDescription = error.message || t.authErrorGenericDesc;
        }
        
        setCoachSignupFeedback({
          variant: "destructive",
          title: errorTitle,
          description: errorDescription,
        });
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const isExistingUser = !data.user.identities || data.user.identities.length === 0;
        
        if (isExistingUser) {
          console.log('📝 User already exists (fake success):', email);
          setCoachSignupFeedback({
            variant: "destructive",
            title: t.authErrorEmailExists,
            description: t.authErrorEmailExistsDesc,
          });
          toast({
            title: t.authErrorEmailExists,
            description: t.authErrorEmailExistsDesc,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        console.log('📝 New coach user created:', data.user.id);
        
        // Send coach welcome email with special coach offers info
        try {
          await supabase.functions.invoke('send-coach-welcome', {
            body: { email, name }
          });
          console.log('📧 Coach welcome email sent');
        } catch (emailError) {
          console.error('📧 Failed to send coach welcome email:', emailError);
          // Don't block signup if email fails
        }
        
        const okFeedback = {
          variant: "default" as const,
          title: language === 'el' ? 'Επιτυχής εγγραφή Coach!' : 'Coach Registration Successful!',
          description: t.authSuccessSignupDesc,
        };
        setCoachSignupFeedback(okFeedback);
        toast({
          title: okFeedback.title,
          description: okFeedback.description,
        });
      } else {
        console.log('📝 No user returned, likely already exists');
        setCoachSignupFeedback({
          variant: "destructive",
          title: t.authErrorSignupProblem,
          description: t.authErrorSignupProblemDesc,
        });
        toast({
          title: t.authErrorSignupProblem,
          description: t.authErrorSignupProblemDesc,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Coach signup error:', error);
      setCoachSignupFeedback({
        variant: "destructive",
        title: t.authError,
        description: error.message || t.authErrorGenericDesc,
      });
      toast({
        title: t.authError,
        description: error.message || t.authErrorGenericDesc,
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
        let errorMessage = t.authLoginErrorGeneric;
        
        if (error.message.includes('Invalid login credentials')) {
          // Ελέγχουμε αν ο χρήστης υπάρχει στη βάση
          const { data: userExists } = await supabase
            .from('app_users')
            .select('email, user_status')
            .eq('email', email)
            .single();
          
          if (userExists) {
            errorMessage = t.authCheckEmailConfirmation;
          } else {
            errorMessage = t.authWrongCredentials;
          }
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = t.authEmailNotConfirmed;
        } else if (error.message.includes('Too many requests')) {
          errorMessage = t.authErrorTooManyRequestsDesc;
        }
        
        throw new Error(errorMessage);
      }

      console.log('🔐 Auth successful, checking user profile for:', data.user.id);

      // Check if user has an app_users profile
      const { data: userProfileData, error: profileError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (profileError) {
        console.error('🔐 Profile fetch error:', profileError);
        
        if (profileError.code === 'PGRST116') {
          toast({
            title: t.authProfileProblem,
            description: t.authProfileNotFound,
            variant: "destructive",
          });
        } else {
          toast({
            title: t.authDatabaseError,
            description: t.authDatabaseErrorDesc,
            variant: "destructive",
          });
        }
        await supabase.auth.signOut();
        return;
      }

      if (!userProfileData) {
        console.error('🔐 No user profile found for:', data.user.id);
        toast({
          title: t.authAccountNotActive,
          description: `${t.authAccountInactive} ${t.authContactAdmin}`,
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      console.log('🔐 User profile found:', userProfileData.user_status, 'role:', userProfileData.role);

      if (userProfileData.user_status !== 'active') {
        const statusMessage = userProfileData.user_status === 'pending' 
          ? t.authAccountPending 
          : t.authAccountInactive;
          
        toast({
          title: t.authAccountNotActive,
          description: `${statusMessage} ${t.authContactAdmin}`,
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      // Determine redirect based on role
      const isCoachUser = userProfileData.role === 'coach';
      const redirectPath = isCoachUser ? "/dashboard/coach-overview" : "/dashboard";
      
      console.log('🔐 Login successful, redirecting to:', redirectPath);
      
      toast({
        title: t.authSuccess,
        description: t.authLoginSuccess,
      });

      navigate(redirectPath);
    } catch (error: any) {
      console.error('🔐 Login process error:', error);
      toast({
        title: t.authLoginError,
        description: error.message || t.authLoginErrorGeneric,
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
      // Use current origin so preview environments generate working links too
      // Production on hyperkids.gr will still resolve correctly.
      const redirectUrl = `${window.location.origin}/reset-password`;
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
        title: t.authEmailSent,
        description: t.authCheckEmailForReset,
      });

      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: t.authError,
        description: error.message || t.authResetError,
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
          <img src="/auth-logo.png" alt="HYPERKIDS" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-white">{t.authLoading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--auth-black))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center">
            <img src="/auth-logo.png" alt="HYPERKIDS" className="h-16" />
          </Link>
        </div>

        <Card className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))]">
          <CardHeader>
            <CardTitle className="text-center text-white">
              {showForgotPassword ? t.authResetPassword : (activeTab === 'coach-signup' ? (language === 'el' ? 'Εγγραφή Coach' : 'Coach Sign Up') : (activeTab === 'signup' ? t.authSignupTitle : t.authLoginTitle))}
            </CardTitle>
            <CardDescription className="text-center text-white">
              {showForgotPassword ? t.authResetPasswordSubtitle : (activeTab === 'coach-signup' ? (language === 'el' ? 'Δημιουργήστε λογαριασμό coach' : 'Create your coach account') : (activeTab === 'signup' ? t.authSignupSubtitle : t.authLoginSubtitle))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-white">Email</Label>
                  <Input 
                    id="reset-email" 
                    name="reset-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                    className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-none bg-[#aca097] text-black hover:bg-[#aca097]/90 border-2 border-transparent transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? t.authSending : t.authSendResetEmail}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full rounded-none border-[hsl(var(--auth-gray))] text-[#aca097] hover:bg-[hsl(var(--auth-gray)/0.1)]"
                  onClick={() => setShowForgotPassword(false)}
                >
                  {t.authBackToLogin}
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup' | 'coach-signup')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-[hsl(var(--auth-black))] border border-[hsl(var(--auth-gray))]">
                  <TabsTrigger value="login" className="text-white data-[state=active]:bg-[#aca097] data-[state=active]:text-black text-xs sm:text-sm">{t.authLogin}</TabsTrigger>
                  <TabsTrigger value="signup" className="text-white data-[state=active]:bg-[#aca097] data-[state=active]:text-black text-xs sm:text-sm">{t.authSignup}</TabsTrigger>
                  <TabsTrigger value="coach-signup" className="text-white data-[state=active]:bg-[#00ffba] data-[state=active]:text-black text-xs sm:text-sm">For Coach</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">{t.authEmail}</Label>
                      <Input id="email" name="email" type="email" placeholder="your@email.com" required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">{t.authPassword}</Label>
                      <Input id="password" name="password" type="password" required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60" />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full rounded-none bg-[#aca097] text-black hover:bg-[#aca097]/90 border-2 border-transparent transition-all duration-300" 
                      disabled={isLoading}
                    >
                      {isLoading ? t.authLoggingIn : t.authLogin}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-[#aca097] hover:underline"
                      >
                        {t.authForgotPassword}
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">{t.authFullName}</Label>
                      <Input id="name" name="name" type="text" placeholder={t.authFullNamePlaceholder} required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-white">{t.authEmail}</Label>
                      <Input id="signup-email" name="signup-email" type="email" placeholder="your@email.com" required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-white">{t.authPassword}</Label>
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

                          // Live validation (Greek + Latin) without Unicode property escapes
                          const lowerRe = /[a-zα-ωάέήίόύώϊϋΐΰ]/;
                          const upperRe = /[A-ZΑ-ΩΆΈΉΊΌΎΏΪΫ]/;
                          const numberRe = /[0-9]/;
                          const specialRe = /[^A-Za-z0-9Α-ΩΆΈΉΊΌΎΏΪΫα-ωάέήίόύώϊϋΐΰ]/;

                          const errors: string[] = [];
                          if (val.length < 8) errors.push(t.authPasswordMinChars);
                          if (!lowerRe.test(val)) errors.push(t.authPasswordLowercase);
                          if (!upperRe.test(val)) errors.push(t.authPasswordUppercase);
                          if (!numberRe.test(val)) errors.push(language === 'el' ? "αριθμούς" : "numbers");
                          if (!specialRe.test(val)) errors.push(language === 'el' ? "ειδικούς χαρακτήρες" : "special characters");

                          setPasswordError(errors.length ? `${t.authPasswordRequirements} ${errors.join(', ')}.` : null);
                        }}
                        aria-invalid={!!passwordError}
                        aria-describedby="password-help"
                        className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60"
                      />
                      <p id="password-help" className={`text-xs ${passwordError ? 'text-red-600' : 'text-white/70'}`}>
                        {t.authPasswordHint}
                      </p>
                     </div>

                     {signupFeedback && (
                       <Alert
                         variant={signupFeedback.variant}
                         className="rounded-none bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white"
                       >
                         <AlertTitle className="text-white">{signupFeedback.title}</AlertTitle>
                         {signupFeedback.description && (
                           <AlertDescription className="text-white">
                             {signupFeedback.description}
                           </AlertDescription>
                         )}
                       </Alert>
                     )}

                     <Button 
                       type="submit" 
                       className="w-full rounded-none bg-[#aca097] text-black hover:bg-[#aca097]/90 border-2 border-transparent transition-all duration-300" 
                       disabled={isLoading || !!passwordError || signupPassword.length === 0}
                     >
                      {isLoading ? t.authSigningUp : t.authSignup}
                    </Button>
                    <div className="text-xs text-white text-center">
                      {t.authAfterSignup}
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="coach-signup">
                  <form onSubmit={handleCoachSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="coach-name" className="text-white">{t.authFullName}</Label>
                      <Input id="coach-name" name="coach-name" type="text" placeholder={t.authFullNamePlaceholder} required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coach-email" className="text-white">{t.authEmail}</Label>
                      <Input id="coach-email" name="coach-email" type="email" placeholder="your@email.com" required className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coach-password" className="text-white">{t.authPassword}</Label>
                      <Input
                        id="coach-password"
                        name="coach-password"
                        type="password"
                        required
                        minLength={8}
                        value={coachSignupPassword}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoachSignupPassword(val);

                          // Live validation
                          const lowerRe = /[a-zα-ωάέήίόύώϊϋΐΰ]/;
                          const upperRe = /[A-ZΑ-ΩΆΈΉΊΌΎΏΪΫ]/;
                          const numberRe = /[0-9]/;
                          const specialRe = /[^A-Za-z0-9Α-ΩΆΈΉΊΌΎΏΪΫα-ωάέήίόύώϊϋΐΰ]/;

                          const errors: string[] = [];
                          if (val.length < 8) errors.push(t.authPasswordMinChars);
                          if (!lowerRe.test(val)) errors.push(t.authPasswordLowercase);
                          if (!upperRe.test(val)) errors.push(t.authPasswordUppercase);
                          if (!numberRe.test(val)) errors.push(language === 'el' ? "αριθμούς" : "numbers");
                          if (!specialRe.test(val)) errors.push(language === 'el' ? "ειδικούς χαρακτήρες" : "special characters");

                          setCoachPasswordError(errors.length ? `${t.authPasswordRequirements} ${errors.join(', ')}.` : null);
                        }}
                        aria-invalid={!!coachPasswordError}
                        aria-describedby="coach-password-help"
                        className="bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white placeholder:text-white/60"
                      />
                      <p id="coach-password-help" className={`text-xs ${coachPasswordError ? 'text-red-600' : 'text-white/70'}`}>
                        {t.authPasswordHint}
                      </p>
                    </div>

                    {coachSignupFeedback && (
                      <Alert
                        variant={coachSignupFeedback.variant}
                        className="rounded-none bg-[hsl(var(--auth-black))] border-[hsl(var(--auth-gray))] text-white"
                      >
                        <AlertTitle className="text-white">{coachSignupFeedback.title}</AlertTitle>
                        {coachSignupFeedback.description && (
                          <AlertDescription className="text-white">
                            {coachSignupFeedback.description}
                          </AlertDescription>
                        )}
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full rounded-none bg-[#00ffba] text-black hover:bg-[#00ffba]/90 border-2 border-transparent transition-all duration-300" 
                      disabled={isLoading || !!coachPasswordError || coachSignupPassword.length === 0}
                    >
                      {isLoading ? t.authSigningUp : (language === 'el' ? 'Εγγραφή ως Coach' : 'Sign Up as Coach')}
                    </Button>
                    <div className="text-xs text-white text-center">
                      {t.authAfterSignup}
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            )}


            <div className="mt-6 text-center">
              <Link to={`/?lang=${language}`} className="text-sm text-[#aca097] hover:underline">
                {t.authBackToHome}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
