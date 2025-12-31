import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes - specifically for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event, 'Session:', !!session);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ Password recovery event detected');
        setIsValidSession(true);
      } else if (event === 'SIGNED_IN' && session) {
        // Check if this is a recovery session by looking at the URL hash
        const hash = window.location.hash;
        const isRecovery = hash.includes('type=recovery') || hash.includes('type=magiclink');
        
        if (isRecovery) {
          console.log('✅ Recovery session from URL hash');
          setIsValidSession(true);
        } else {
          // Regular sign in - might be from clicking the recovery link
          // Give it a moment to check if there's a valid session
          setIsValidSession(true);
        }
      }
    });

    // Also check for existing session that might be a recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('✅ Existing session found for password reset');
        setIsValidSession(true);
      } else {
        // Check URL for recovery tokens
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        const hasToken = hash.includes('access_token') || 
                        hash.includes('type=recovery') ||
                        searchParams.has('token') ||
                        searchParams.has('code');
        
        if (hasToken) {
          console.log('🔄 Token found in URL, waiting for auth event...');
          // Wait a bit for the auth event to fire
          setTimeout(() => {
            if (isValidSession === null) {
              setIsValidSession(false);
            }
          }, 3000);
        } else {
          console.log('❌ No valid recovery session or token');
          setIsValidSession(false);
        }
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if session is definitely invalid
  useEffect(() => {
    if (isValidSession === false) {
      toast.error('Το link ανάκτησης κωδικού δεν είναι έγκυρο ή έχει λήξει');
      navigate('/auth');
    }
  }, [isValidSession, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    if (password.length < 6) {
      toast.error('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error('Σφάλμα κατά την ενημέρωση του κωδικού: ' + error.message);
        return;
      }

      toast.success('Ο κωδικός σας ενημερώθηκε επιτυχώς!');
      
      // Sign out and redirect to login page after successful password reset
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00ffba]" />
          <p className="text-gray-600">Επαλήθευση συνδέσμου...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hyperkids</h1>
          <p className="text-gray-600">Δημιουργία νέου κωδικού</p>
        </div>

        <Card className="rounded-none shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Key className="w-6 h-6 text-[#00ffba]" />
              Νέος Κωδικός
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Νέος Κωδικός</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Εισάγετε τον νέο κωδικό σας"
                    required
                    minLength={6}
                    className="rounded-none pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Επιβεβαίωση Κωδικού</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Επιβεβαιώστε τον νέο κωδικό σας"
                    required
                    minLength={6}
                    className="rounded-none pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? "Ενημέρωση..." : "Ενημέρωση Κωδικού"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => navigate('/auth')}
                className="text-[#00ffba] hover:text-[#00ffba]/90"
              >
                Επιστροφή στη σύνδεση
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
