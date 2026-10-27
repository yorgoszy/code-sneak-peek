import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Menu, X, LogIn } from "lucide-react";
import heroImage from "@/assets/wekeep-hero.jpg";
import logoAsset from "@/assets/wekeep-logo.png.asset.json";

const navLinks = [
  { label: "Αρχική", href: "#home" },
  { label: "Λειτουργίες", href: "#features" },
  { label: "Επικοινωνία", href: "#contact" },
];

export default function WeKeepLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth() as any;
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "WeKeep — Πλατφόρμα για προπονητές";
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const previousIcon = iconLink?.href;
    if (iconLink) iconLink.href = "/wekeep-icon.png";
    const isPreview = new URLSearchParams(window.location.search).has("preview");
    if (!isPreview && !loading && isAuthenticated) navigate("/dashboard/coach-overview", { replace: true });
    return () => {
      if (iconLink && previousIcon) iconLink.href = previousIcon;
    };
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Top menu */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <a href="#home" className="flex items-center">
            <img src={logoAsset.url} alt="WeKeep" width={1518} height={476} className="h-6 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
            <Button onClick={() => setLoginOpen(true)} className="rounded-none">
              <LogIn className="h-4 w-4 mr-2" /> Σύνδεση
            </Button>
          </div>
          <Button variant="outline" size="sm" className="md:hidden rounded-none" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm">
                {l.label}
              </a>
            ))}
            <Button onClick={() => { setMenuOpen(false); setLoginOpen(true); }} className="w-full rounded-none">
              Σύνδεση
            </Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative min-h-screen flex items-center pt-16">
        <img src={heroImage} alt="Προπονητής παρακολουθεί αθλήτρια" width={1920} height={1088}
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Για προπονητές</p>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
              Κράτα τους αθλητές σου σε τροχιά.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Προγράμματα, συνδρομές, τεστ και πρόοδος — όλα σε ένα μέρος.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => setLoginOpen(true)} className="rounded-none">
                Σύνδεση
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-none">
                <a href="#features">Μάθε περισσότερα</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Login dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <img src={logoAsset.url} alt="WeKeep" width={1518} height={476} className="h-5 w-auto self-start" />
            <DialogTitle>Σύνδεση στο WeKeep</DialogTitle>
          </DialogHeader>
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
            <button type="button" onClick={handleReset} className="w-full text-xs text-muted-foreground underline">
              Ξέχασα τον κωδικό
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
