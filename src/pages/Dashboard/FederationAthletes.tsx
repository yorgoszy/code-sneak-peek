import React, { useEffect, useState } from 'react';
import { Menu, Plus, Trash2, UserCheck } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FederationSidebar } from '@/components/FederationSidebar';
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Membership {
  id: string;
  athlete_id: string;
  registration_number: string | null;
  is_active: boolean;
  joined_at: string;
  athlete?: { id: string; name: string; email: string; photo_url?: string | null };
}

const FederationAthletes: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userProfile } = useAuthContext();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const federationId = userProfile?.id;

  const load = async () => {
    if (!federationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('athlete_federations')
      .select('id, athlete_id, registration_number, is_active, joined_at, athlete:app_users!athlete_federations_athlete_id_fkey(id, name, email, photo_url)')
      .eq('federation_id', federationId)
      .order('joined_at', { ascending: false });
    if (error) {
      toast.error('Σφάλμα φόρτωσης: ' + error.message);
    } else {
      setMemberships((data || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [federationId]);

  const handleAdd = async () => {
    if (!selectedUserId || !federationId) {
      toast.error('Επιλέξτε αθλητή');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('athlete_federations').insert({
      athlete_id: selectedUserId,
      federation_id: federationId,
      registration_number: registrationNumber.trim() || null,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes('unique') || error.message.includes('duplicate')
        ? 'Ο αθλητής είναι ήδη εγγεγραμμένος στην ομοσπονδία'
        : 'Σφάλμα: ' + error.message);
      return;
    }
    toast.success('Ο αθλητής δηλώθηκε επιτυχώς');
    setAddOpen(false);
    setSelectedUserId('');
    setRegistrationNumber('');
    load();
  };

  const handleToggleActive = async (m: Membership) => {
    const { error } = await supabase
      .from('athlete_federations')
      .update({ is_active: !m.is_active })
      .eq('id', m.id);
    if (error) toast.error(error.message);
    else load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('athlete_federations').delete().eq('id', deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success('Διαγράφηκε');
      load();
    }
    setDeleteId(null);
  };

  const renderSidebar = () => <FederationSidebar />;

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Αθλητές Ομοσπονδίας</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <UserCheck className="w-6 h-6" /> Αθλητές Ομοσπονδίας
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Δήλωση αθλητών στην ομοσπονδία με αριθμό δελτίου. Ένας αθλητής μπορεί να ανήκει σε πολλές ομοσπονδίες.
                </p>
              </div>
              <Button onClick={() => setAddOpen(true)} className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black">
                <Plus className="w-4 h-4 mr-2" /> Δήλωση Αθλητή
              </Button>
            </div>

            <div className="lg:hidden mb-4">
              <Button onClick={() => setAddOpen(true)} className="rounded-none w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black">
                <Plus className="w-4 h-4 mr-2" /> Δήλωση Αθλητή
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Φόρτωση...</div>
            ) : memberships.length === 0 ? (
              <Card className="rounded-none p-8 text-center text-muted-foreground">
                Δεν υπάρχουν εγγεγραμμένοι αθλητές. Πάτησε "Δήλωση Αθλητή" για να ξεκινήσεις.
              </Card>
            ) : (
              <div className="space-y-2">
                {memberships.map((m) => (
                  <Card key={m.id} className="rounded-none p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {m.athlete?.photo_url ? (
                        <img src={m.athlete.photo_url} alt={m.athlete.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                          {m.athlete?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{m.athlete?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.athlete?.email || ''}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block text-sm">
                      <span className="text-muted-foreground">Δελτίο: </span>
                      <span className="font-mono">{m.registration_number || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={m.is_active} onCheckedChange={() => handleToggleActive(m)} />
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)} className="rounded-none">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Δήλωση Αθλητή στην Ομοσπονδία</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Χρήστης</Label>
              <UserSearchCombobox
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                placeholder="Αναζήτηση αθλητή..."
              />
            </div>
            <div className="space-y-2">
              <Label>Αριθμός Δελτίου</Label>
              <Input
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="π.χ. 12345"
                className="rounded-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-none">Ακύρωση</Button>
            <Button onClick={handleAdd} disabled={saving || !selectedUserId} className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black">
              {saving ? 'Αποθήκευση...' : 'Δήλωση'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή εγγραφής;</AlertDialogTitle>
            <AlertDialogDescription>
              Ο αθλητής θα αφαιρεθεί από την ομοσπονδία. Η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default FederationAthletes;
