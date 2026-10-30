import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export type ThaiHubCheckoutPlan = 'club' | 'coach' | 'federation';

const primary = "rounded-none bg-[var(--th-blue)] hover:bg-[var(--th-blue-hover)] text-[var(--th-white)]";

export async function startThaiHubCheckout(plan: ThaiHubCheckoutPlan): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('thaihub-plan-checkout', { body: { action: 'checkout', plan } });
  if (error) {
    const body = await (error as any).context?.json?.().catch(() => null);
    return body?.error ?? 'Η πληρωμή δεν ξεκίνησε. Δοκίμασε ξανά.';
  }
  if (data?.url) { window.location.href = data.url; return null; }
  if (data?.activated) { window.location.href = '/dashboard/coach-overview'; return null; }
  return data?.error ?? 'Η πληρωμή δεν ξεκίνησε. Δοκίμασε ξανά.';
}

interface Props { plan: { id: ThaiHubCheckoutPlan; name: string; price: number } | null; onClose: () => void; }

export function ThaiHubPlanCheckoutDialog({ plan, onClose }: Props) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    setBusy(true); setMessage(null);
    try {
      if (mode === 'signup') {
        if (password.length < 6) { setMessage('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.'); return; }
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/thaihub#purchase` } });
        if (error) { setMessage(error.message.includes('registered') ? 'Υπάρχει ήδη λογαριασμός με αυτό το email. Πάτα «Έχω λογαριασμό».' : 'Η δημιουργία λογαριασμού απέτυχε.'); return; }
        if (!data.session) { setMessage('Σου στείλαμε email επιβεβαίωσης. Επιβεβαίωσε, συνδέσου και πάτα ξανά το πακέτο.'); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) { setMessage('Λάθος email ή κωδικός.'); return; }
      }
      const failure = await startThaiHubCheckout(plan.id);
      if (failure) setMessage(failure);
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!plan} onOpenChange={open => !open && onClose()}>
      <DialogContent className="rounded-none max-w-md bg-[var(--th-white)] text-[var(--th-blue)]">
        <DialogHeader>
          <DialogTitle>ThaiHub {plan?.name} — {plan?.price}€ / έτος</DialogTitle>
          <DialogDescription className="text-[var(--th-blue)]">
            {mode === 'signup' ? 'Δημιούργησε λογαριασμό για να συνεχίσεις στην πληρωμή.' : 'Συνδέσου για να συνεχίσεις στην πληρωμή.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && <div className="space-y-1"><Label htmlFor="th-name">Ονοματεπώνυμο / Επωνυμία</Label><Input id="th-name" required value={name} onChange={e => setName(e.target.value)} className="rounded-none" /></div>}
          <div className="space-y-1"><Label htmlFor="th-email">Email</Label><Input id="th-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="rounded-none" /></div>
          <div className="space-y-1"><Label htmlFor="th-pass">Κωδικός</Label><Input id="th-pass" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="rounded-none" /></div>
          {message && <p className="text-sm text-[var(--th-red)]">{message}</p>}
          <Button type="submit" disabled={busy} className={`w-full ${primary}`}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'signup' ? 'Δημιουργία λογαριασμού & πληρωμή' : 'Σύνδεση & πληρωμή'}
          </Button>
          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(null); }} className="w-full text-sm underline">
            {mode === 'signup' ? 'Έχω λογαριασμό' : 'Νέος λογαριασμός'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
