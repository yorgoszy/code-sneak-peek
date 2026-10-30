import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { coachFeatures } from './thaihubPlans';
import { thaihubLandingCopy } from './thaihubLandingCopy';

export function CoachUpgradeDialog({ open, onOpenChange, coachId }: { open: boolean; onOpenChange: (open: boolean) => void; coachId: string }) {
  const [paying, setPaying] = useState(false);
  const quote = useQuery({
    queryKey: ['coach-upgrade-quote', coachId],
    enabled: open && Boolean(coachId),
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('coach-upgrade', { body: { action: 'quote', user_id: coachId } });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
        throw new Error(details?.error || 'Δεν ήταν δυνατός ο υπολογισμός του ποσού.');
      }
      if (!Number.isInteger(data?.amount_cents) || data.amount_cents <= 0 || data.currency !== 'eur') throw new Error('Δεν ήταν δυνατός ο υπολογισμός του ποσού.');
      return data as { amount_cents: number; remaining_days: number; months: number; end_date: string; coach_yearly_cents: number };
    },
  });
  const money = (cents: number) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  const amount = quote.data ? money(quote.data.amount_cents) : null;
  const checkout = async () => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('coach-upgrade', { body: { action: 'checkout', user_id: coachId } });
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
        {quote.isError && <p role="alert" className="text-sm text-destructive">{quote.error.message}</p>}
        {quote.data && (
          <div className="space-y-1 border border-[var(--th-blue)] p-3 text-sm text-[var(--th-blue)]">
            <p>Απομένουν <strong>{quote.data.remaining_days} ημέρες</strong> ({quote.data.months} {quote.data.months === 1 ? 'μήνας' : 'μήνες'}) έως {new Date(`${quote.data.end_date}T00:00:00`).toLocaleDateString('el-GR')}.</p>
            <p>Πληρώνεις τώρα: <strong>{amount}</strong></p>
            <p>Μετά τη λήξη: <strong>{money(quote.data.coach_yearly_cents)} / έτος</strong> για Coach.</p>
          </div>
        )}
        <Button disabled={paying || quote.isFetching || amount === null || quote.isError} onClick={checkout} className="rounded-none bg-[var(--th-blue)] hover:bg-[var(--th-blue)] text-primary-foreground disabled:opacity-100">
          {paying || quote.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          {quote.isFetching ? 'Υπολογισμός ποσού…' : amount ? `Online πληρωμή — ${amount}` : 'Online πληρωμή'}
        </Button>
        {quote.isError && <Button variant="outline" className="rounded-none text-[var(--th-blue)]" onClick={() => void quote.refetch()}>Δοκιμή ξανά</Button>}
      </DialogContent>
    </Dialog>
  );
}