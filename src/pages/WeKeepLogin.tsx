import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function WeKeepLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "WeKeep — Σύνδεση Coach";
    if (!loading && isAuthenticated) navigate("/dashboard/coach-overview", { replace: true });
  }, [loading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError("Λάθος email ή κωδικός.");
      return;
    }
    navigate("/dashboard/coach-overview", { replace: true });
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Γράψε πρώτα το email σου.");
      return;
    }
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setError("Σου στείλαμε email για αλλαγή κωδικού.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-border p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">WeKeep</h1>
          <p className="text-sm text-muted-foreground">Σύνδεση για προπονητές</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wk-email">Email</Label>
            <Input id="wk-email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className="rounded-none" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wk-password">Κωδικός</Label>
            <Input id="wk-password" type="password" required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} className="rounded-none" />
          </div>
          {error && <p className="text-sm text-muted-foreground">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full rounded-none">
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Σύνδεση
          </Button>
          <button type="button" onClick={handleReset}
            className="w-full text-xs text-muted-foreground underline">
            Ξέχασα τον κωδικό
          </button>
        </form>
      </div>
    </div>
  );
}
