import { useState } from 'react';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { coachFeatures } from './thaihubPlans';
import { thaihubLandingCopy } from './thaihubLandingCopy';

export function CoachUpgradeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [paying, setPaying] = useState(false);
  const checkout = async () => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('coach-upgrade', { body: { action: 'checkout' } });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
        throw new Error(details?.error || 'Δεν ήταν δυνατή η έναρξη πληρωμής.');
      }
      if (data?.upgraded) {
        window.location.reload();
        return;
      }
      const url = new URL(data?.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Μη έγκυρη σελίδα πληρωμής.');
      window.location.assign(url.href);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Η πληρωμή δεν ξεκίνησε.');
    } finally {
      setPaying(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--th-blue)]">Upgrade to Coach</DialogTitle>
          <DialogDescription className="text-[var(--th-blue)]">Όλα του Club και επιπλέον:</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-[var(--th-blue)]">
          {coachFeatures.map(feature => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0 text-[var(--th-blue)]" aria-hidden="true" />
              <span>{feature === 'programDesign' ? 'Program Design — Σχεδιασμός Προγράμματος' : thaihubLandingCopy.el.planFeatures[feature]}</span>
            </li>
          ))}
        </ul>
        <Button disabled={paying} onClick={checkout} className="rounded-none bg-[var(--th-blue)] hover:bg-[var(--th-blue)] text-primary-foreground disabled:opacity-100">
          {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}Online πληρωμή
        </Button>
      </DialogContent>
    </Dialog>
  );
}