import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuthContext } from '@/contexts/AuthContext';

const DISMISS_KEY = 'notif_prompt_dismissed_v1';

export const NotificationPermissionPrompt: React.FC = () => {
  const { isAuthenticated, userProfile } = useAuthContext();
  const { permission, isSupported, isSubscribed, subscribe, loading } = usePushNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !userProfile?.id || !isSupported) return;
    // Permanent opt-out / opt-in memory (persists across sessions and app restarts)
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (isSubscribed || permission !== 'default') return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [isAuthenticated, userProfile?.id, isSupported, permission, isSubscribed]);

  const handleAllow = async () => {
    const ok = await subscribe();
    setOpen(false);
    // Never ask again, whether it succeeded or the user declined at the browser prompt
    localStorage.setItem(DISMISS_KEY, '1');
    try { sessionStorage.removeItem(DISMISS_KEY); } catch {}
    if (!ok) return;
  };
  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleDismiss()}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <DialogTitle>Ενεργοποίηση ειδοποιήσεων</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground space-y-2 pt-2">
            Λάβε ειδοποιήσεις για:
            <ul className="list-disc pl-5 pt-1 space-y-1">
              <li>Υπενθυμίσεις προπόνησης</li>
              <li>Νέα προγράμματα & tests</li>
              <li>Λήξη ιατρικής βεβαίωσης</li>
              <li>Επιβεβαιώσεις κρατήσεων</li>
            </ul>
            Μπορείς να τις ρυθμίσεις οποτεδήποτε στις Ειδοποιήσεις.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-none" onClick={handleDismiss}>Όχι τώρα</Button>
          <Button className="rounded-none" onClick={handleAllow} disabled={loading}>
            {loading ? 'Παρακαλώ…' : 'Ενεργοποίηση'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
