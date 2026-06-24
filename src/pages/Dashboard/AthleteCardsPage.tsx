import { useEffect, useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IdCard, Menu, Plus, Pencil, Search } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { matchesSearchTerm } from "@/lib/utils";
import { UserSearchCombobox } from "@/components/users/UserSearchCombobox";

interface AthleteRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  photo_url: string | null;
  card_number: string | null;
}

export default function AthleteCardsPage() {
  const { isAdmin, userProfile } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [rows, setRows] = useState<AthleteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AthleteRow | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [cardNumber, setCardNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveCoachId = userProfile?.id ?? null;

  const load = async () => {
    if (!effectiveCoachId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("app_users")
      .select("id, name, email, avatar_url, photo_url, card_number, role, is_athlete, coach_id")
      .eq("coach_id", effectiveCoachId)
      .or("role.eq.athlete,is_athlete.eq.true")
      .order("name");
    if (error) {
      toast.error("Σφάλμα φόρτωσης");
    } else {
      setRows((data || []) as AthleteRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [effectiveCoachId]);

  const filtered = useMemo(
    () => rows.filter(r =>
      matchesSearchTerm(r.name, search) ||
      matchesSearchTerm(r.email, search) ||
      matchesSearchTerm(r.card_number || "", search)
    ),
    [rows, search]
  );

  const openAdd = () => {
    setEditing(null);
    setSelectedUserId("");
    setCardNumber("");
    setDialogOpen(true);
  };

  const openEdit = (r: AthleteRow) => {
    setEditing(r);
    setSelectedUserId(r.id);
    setCardNumber(r.card_number || "");
    setDialogOpen(true);
  };

  const save = async () => {
    if (!selectedUserId) {
      toast.error("Επιλέξτε αθλητή");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("app_users")
      .update({ card_number: cardNumber.trim() || null })
      .eq("id", selectedUserId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Αποθηκεύτηκε");
    setDialogOpen(false);
    load();
  };

  const renderSidebar = () =>
    isAdmin()
      ? <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      : <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} contextCoachId={effectiveCoachId || undefined} />;

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
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <IdCard className="h-5 w-5" /> Δελτία Αθλητή
                </h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Card className="rounded-none">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IdCard className="h-5 w-5 text-[#00ffba]" /> Δελτία Αθλητή ({filtered.length})
                  </CardTitle>
                  <Button onClick={openAdd} className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Προσθήκη Δελτίου
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Αναζήτηση με όνομα, email ή αριθμό δελτίου..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-none"
                  />
                </div>

                {loading ? (
                  <p className="text-center py-8 text-gray-500">Φόρτωση...</p>
                ) : filtered.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Δεν υπάρχουν δελτία αθλητή</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Αθλητής</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Αριθμός Δελτίου</TableHead>
                        <TableHead className="text-right">Ενέργειες</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={r.avatar_url || r.photo_url || ""} />
                                <AvatarFallback>{(r.name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span>{r.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{r.email}</TableCell>
                          <TableCell className="font-mono">{r.card_number || <span className="text-gray-400">-</span>}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="rounded-none" onClick={() => openEdit(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-none sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Επεξεργασία Δελτίου" : "Προσθήκη Δελτίου"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Χρήστης</Label>
              {editing ? (
                <Input value={editing.name} disabled className="rounded-none h-9" />
              ) : (
                <UserSearchCombobox
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  placeholder="Επιλέξτε χρήστη..."
                  coachId={effectiveCoachId || undefined}
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Αριθμός Δελτίου</Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="π.χ. 12345"
                className="rounded-none h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setDialogOpen(false)}>Ακύρωση</Button>
            <Button className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none" disabled={saving} onClick={save}>
              {saving ? "Αποθήκευση..." : "Αποθήκευση"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
