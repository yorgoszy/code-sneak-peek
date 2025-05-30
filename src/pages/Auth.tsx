
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const name = formData.get("name") as string;

    try {
      // Δημιουργία χρήστη στο Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Δημιουργία εγγραφής στον πίνακα app_users
        const { error: profileError } = await supabase
          .from('app_users')
          .insert([
            {
              auth_user_id: data.user.id,
              email: email,
              name: name,
              role: email === 'yorgoszy@gmail.com' ? 'admin' : 'user',
              category: 'general',
              user_status: 'active'
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        toast({
          title: "Επιτυχία!",
          description: "Ο λογαριασμός σας δημιουργήθηκε επιτυχώς.",
        });

        navigate("/");
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

      toast({
        title: "Επιτυχία!",
        description: "Συνδεθήκατε επιτυχώς.",
      });

      navigate("/");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
            <Heart className="h-8 w-8 text-pink-500" />
            <span>HyperKids</span>
          </Link>
          <p className="text-gray-600 mt-2">Καλώς ήρθατε πίσω!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Είσοδος στο λογαριασμό σας</CardTitle>
            <CardDescription className="text-center">
              Συνδεθείτε για να συνεχίσετε
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  <Button type="submit" className="w-full rounded-none" disabled={isLoading}>
                    {isLoading ? "Σύνδεση..." : "Σύνδεση"}
                  </Button>
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
                  <Button type="submit" className="w-full rounded-none" disabled={isLoading}>
                    {isLoading ? "Εγγραφή..." : "Εγγραφή"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

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
