import { Check, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { coachFeatures } from './thaihubPlans';
import { thaihubLandingCopy } from './thaihubLandingCopy';

export function CoachUpgradeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
        <Button disabled className="rounded-none bg-[var(--th-blue)] text-primary-foreground disabled:opacity-100">
          <CreditCard className="mr-2 h-4 w-4" />Online πληρωμή — σύντομα
        </Button>
      </DialogContent>
    </Dialog>
  );
}