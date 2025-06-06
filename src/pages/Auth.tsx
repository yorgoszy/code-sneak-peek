
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
    const password = formData.get("signup-password") as string;
    const name = formData.get("name") as string;

    try {
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      if (data.user) {
        // Note: User creation in app_users table now requires admin privileges
        // Regular users will be created by admins through the admin panel
        toast({
          title: "Εγγραφή ολοκληρώθηκε!",
          description: "Ελέγξτε το email σας για επιβεβαίωση. Ένας διαχειριστής θα ενεργοποιήσει τον λογαριασμό σας.",
        });
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has an app_users profile
      const { data: userProfile } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (!userProfile) {
        toast({
          title: "Λογαριασμός μη ενεργοποιημένος",
          description: "Ο λογαριασμός σας δεν έχει ενεργοποιηθεί ακόμη. Επικοινωνήστε με έναν διαχειριστή.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      toast({
        title: "Επιτυχία!",
        description: "Συνδεθήκατε επιτυχώς.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Signin error:', error);
      toast({
        title: "Σφάλμα",
        description: error.message || "Λάθος email ή κωδικός πρόσβασης.",
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Email Στάλθηκε!",
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
                  className="w-full rounded-none bg-[#00ffba] text-black hover:bg-transparent hover:border-white hover:text-white border-2 border-transparent transition-all duration-300" 
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
                      className="w-full rounded-none bg-[#00ffba] text-black hover:bg-transparent hover:border-white hover:text-white border-2 border-transparent transition-all duration-300" 
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
                      <Input id="signup-password" name="signup-password" type="password" required />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full rounded-none bg-[#00ffba] text-black hover:bg-transparent hover:border-white hover:text-white border-2 border-transparent transition-all duration-300" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Εγγραφή..." : "Εγγραφή"}
                    </Button>
                    <div className="text-xs text-gray-600 text-center">
                      Μετά την εγγραφή, ένας διαχειριστής θα ενεργοποιήσει τον λογαριασμό σας.
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
