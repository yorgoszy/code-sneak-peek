import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Trash2, Menu } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/Sidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { useRoleCheck } from '@/hooks/useRoleCheck';

const NOTIF_TYPES: { key: string; label: string; desc: string }[] = [
  { key: 'workout_reminder', label: 'Υπενθύμιση προπόνησης', desc: 'Ειδοποίηση 30-60 λεπτά πριν την προπόνηση' },
  { key: 'program_assigned', label: 'Νέο πρόγραμμα', desc: 'Όταν ο προπονητής σου αναθέτει νέο πρόγραμμα' },
  { key: 'test_scheduled', label: 'Νέο test', desc: 'Όταν προγραμματίζεται test' },
  { key: 'coach_message', label: 'Μήνυμα από προπονητή', desc: 'Νέα μηνύματα από τον προπονητή σου' },
  { key: 'rpe_reminder', label: 'Υπενθύμιση RPE', desc: 'Υπενθύμιση καταγραφής έντασης μετά από προπόνηση' },
  { key: 'health_card_expiry', label: 'Λήξη ιατρικής βεβαίωσης', desc: 'Όταν λήγει η βεβαίωσή σου' },
  { key: 'booking_confirmation', label: 'Επιβεβαίωση κράτησης', desc: 'Όταν επιβεβαιώνεται κράτηση' },
  { key: 'booking_reminder_24h', label: 'Υπενθύμιση κράτησης 24ω', desc: 'Μία μέρα πριν την κράτηση' },
  { key: 'goal_milestone', label: 'Ορόσημα στόχων', desc: 'Όταν φτάνεις ορόσημο σε στόχο' },
  { key: 'award_unlocked', label: 'Νέα βραβεία', desc: 'Όταν ξεκλειδώνεις βραβείο' },
  { key: 'muaythai_sparring_reminder', label: 'Sparring υπενθύμιση', desc: 'Υπενθυμίσεις για sparring sessions' },
  { key: 'recovery_alert', label: 'Recovery alert', desc: 'Όταν εντοπίζεται υψηλή κούραση' },
];

export default function NotificationPreferencesPage() {
  const { userProfile } = useAuthContext();
  const { isAdmin } = useRoleCheck();
  const { permission, isSubscribed, isSupported, subscribe, unsubscribe, preferences, updatePreferences, sendTest, loading } = usePushNotifications();
  const [devices, setDevices] = useState<any[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const loadDevices = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase
      .from('push_subscriptions')
      .select('id, platform, device_info, last_used_at, created_at, is_active')
      .eq('user_id', userProfile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setDevices(data ?? []);
  };
  useEffect(() => { loadDevices(); }, [userProfile?.id, isSubscribed]);

  const revokeDevice = async (id: string) => {
    await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', id);
    toast.success('Συσκευή αφαιρέθηκε');
    loadDevices();
  };

  const renderSidebar = () => (isAdmin() ? <Sidebar isCollapsed={false} setIsCollapsed={() => {}} /> : <CoachSidebar isCollapsed={false} setIsCollapsed={() => {}} />);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Ειδοποιήσεις</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-4 max-w-3xl">
            <div className="hidden lg:flex items-center gap-2">
              <Bell className="w-5 h-5" /><h1 className="text-2xl font-semibold">Ειδοποιήσεις</h1>
            </div>

            {/* Master push toggle */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Push notifications
                  <Badge variant="outline" className="rounded-none">
                    {!isSupported ? 'Μη υποστηριζόμενο' : permission === 'granted' && isSubscribed ? 'Ενεργό' : permission === 'denied' ? 'Αρνήθηκε' : 'Ανενεργό'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isSupported && <p className="text-sm text-muted-foreground">Ο browser σου δεν υποστηρίζει push notifications.</p>}
                {isSupported && permission === 'denied' && (
                  <p className="text-sm text-destructive">Έχεις μπλοκάρει τις ειδοποιήσεις. Επίτρεψέ τες από τις ρυθμίσεις του browser.</p>
                )}
                {isSupported && permission !== 'denied' && (
                  <div className="flex items-center justify-between">
                    <Label>Ενεργοποίηση push σε αυτή τη συσκευή</Label>
                    <Switch
                      checked={isSubscribed && permission === 'granted'}
                      onCheckedChange={(v) => v ? subscribe() : unsubscribe()}
                      disabled={loading}
                    />
                  </div>
                )}
                {isSubscribed && (
                  <Button size="sm" variant="outline" className="rounded-none" onClick={async () => {
                    const r = await sendTest();
                    if (r?.error) toast.error('Αποτυχία test');
                    else toast.success(`Test εστάλη (${r?.sent ?? 0} συσκευές)`);
                  }}>
                    <Send className="w-4 h-4 mr-2" />Test notification
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Channels */}
            <Card className="rounded-none">
              <CardHeader><CardTitle className="text-base">Κανάλια</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Push channel</Label>
                  <Switch checked={preferences?.push_channel ?? true} onCheckedChange={(v) => updatePreferences({ push_channel: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Email channel</Label>
                  <Switch checked={preferences?.email_channel ?? true} onCheckedChange={(v) => updatePreferences({ email_channel: v })} />
                </div>
              </CardContent>
            </Card>

            {/* Types */}
            <Card className="rounded-none">
              <CardHeader><CardTitle className="text-base">Τύποι ειδοποιήσεων</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {NOTIF_TYPES.map(t => (
                  <div key={t.key} className="flex items-start justify-between gap-4">
                    <div>
                      <Label className="font-medium">{t.label}</Label>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                    <Switch
                      checked={(preferences as any)?.[t.key] ?? true}
                      onCheckedChange={(v) => updatePreferences({ [t.key]: v } as any)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quiet hours */}
            <Card className="rounded-none">
              <CardHeader><CardTitle className="text-base">Ώρες ησυχίας</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Από</Label>
                  <Input type="time" className="rounded-none" value={preferences?.quiet_hours_start?.slice(0,5) ?? '22:00'} onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Έως</Label>
                  <Input type="time" className="rounded-none" value={preferences?.quiet_hours_end?.slice(0,5) ?? '08:00'} onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Timezone</Label>
                  <Input className="rounded-none" value={preferences?.timezone ?? 'Europe/Athens'} onChange={(e) => updatePreferences({ timezone: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            {/* Devices */}
            <Card className="rounded-none">
              <CardHeader><CardTitle className="text-base">Ενεργές συσκευές</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {devices.length === 0 && <p className="text-sm text-muted-foreground">Καμία ενεργή συσκευή.</p>}
                {devices.map(d => (
                  <div key={d.id} className="flex items-center justify-between border border-border p-2">
                    <div className="text-sm">
                      <div className="font-medium uppercase">{d.platform}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {d.device_info?.user_agent ?? '—'}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-none" onClick={() => revokeDevice(d.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
