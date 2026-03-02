import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Plus, Trash2, Building2, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Club {
  id: string;
  club_id: string;
  club: {
    id: string;
    name: string;
    email: string;
    photo_url: string | null;
  };
  athleteCount?: number;
}

const FederationClubs = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
  const [coachSearch, setCoachSearch] = useState("");

  useEffect(() => {
    if (userProfile?.id) fetchClubs();
  }, [userProfile?.id]);

  const fetchClubs = async () => {
    if (!userProfile?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("federation_clubs")
      .select(`
        id,
        club_id,
        club:app_users!federation_clubs_club_id_fkey (
          id, name, email, photo_url
        )
      `)
      .eq("federation_id", userProfile.id);

    if (error) {
      console.error("Error fetching clubs:", error);
      setLoading(false);
      return;
    }

    // Get athlete counts per club
    const clubsWithCounts = await Promise.all(
      (data || []).map(async (item: any) => {
        const { count } = await supabase
          .from("app_users")
          .select("*", { count: "exact", head: true })
          .eq("coach_id", item.club_id)
          .in("role", ["athlete", "general"]);

        return {
          ...item,
          club: Array.isArray(item.club) ? item.club[0] : item.club,
          athleteCount: count || 0,
        };
      })
    );

    setClubs(clubsWithCounts);
    setLoading(false);
  };

  const handleAddClub = async (coachId: string) => {
    if (!userProfile?.id) return;

    const { error } = await supabase.from("federation_clubs").insert({
      federation_id: userProfile.id,
      club_id: coachId,
    });

    if (error) {
      toast({ variant: "destructive", title: "Σφάλμα", description: "Ο σύλλογος υπάρχει ήδη ή δεν βρέθηκε." });
      return;
    }

    toast({ title: "Επιτυχία", description: "Ο σύλλογος προστέθηκε." });
    setAddDialogOpen(false);
    setCoachSearch("");
    fetchClubs();
  };

  const handleDeleteClub = async () => {
    if (!clubToDelete) return;

    const { error } = await supabase.from("federation_clubs").delete().eq("id", clubToDelete);

    if (error) {
      toast({ variant: "destructive", title: "Σφάλμα", description: "Δεν ήταν δυνατή η αφαίρεση." });
    } else {
      toast({ title: "Επιτυχία", description: "Ο σύλλογος αφαιρέθηκε." });
      fetchClubs();
    }
    setDeleteDialogOpen(false);
    setClubToDelete(null);
  };

  const searchCoaches = async (query: string) => {
    setCoachSearch(query);
    if (query.length < 2) {
      setAvailableCoaches([]);
      return;
    }

    // Normalize for accent-insensitive search
    const normalizedQuery = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const { data } = await supabase
      .from("app_users")
      .select("id, name, email, photo_url")
      .eq("role", "coach")
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    // Filter out already added clubs
    const existingClubIds = clubs.map((c) => c.club_id);
    const filtered = (data || []).filter((c) => !existingClubIds.includes(c.id));
    setAvailableCoaches(filtered);
  };

  const filteredClubs = clubs.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.club?.name?.toLowerCase().includes(q) || c.club?.email?.toLowerCase().includes(q);
  });

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

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
                <h1 className="text-lg font-semibold">Σύλλογοι</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Σύλλογοι</h1>
              <Button onClick={() => setAddDialogOpen(true)} className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Προσθήκη Συλλόγου
              </Button>
            </div>

            {/* Mobile add button */}
            <div className="lg:hidden flex justify-end mb-4">
              <Button onClick={() => setAddDialogOpen(true)} className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Προσθήκη
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Αναζήτηση συλλόγου..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-none"
              />
            </div>

            {/* Clubs List */}
            <div className="grid gap-3">
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Φόρτωση...</p>
              ) : filteredClubs.length === 0 ? (
                <Card className="rounded-none">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Building2 className="mx-auto h-12 w-12 mb-3 opacity-30" />
                    <p>Δεν βρέθηκαν σύλλογοι.</p>
                    <p className="text-sm mt-1">Πατήστε "Προσθήκη Συλλόγου" για να ξεκινήσετε.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredClubs.map((club) => (
                  <Card key={club.id} className="rounded-none hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={club.club?.photo_url || ""} />
                          <AvatarFallback className="bg-[#cb8954]/20 text-[#cb8954] rounded-none">
                            {club.club?.name?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{club.club?.name}</p>
                          <p className="text-xs text-muted-foreground">{club.club?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{club.athleteCount}</p>
                          <p className="text-xs text-muted-foreground">αθλητές</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setClubToDelete(club.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Add Club Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Προσθήκη Συλλόγου</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Αναζήτηση coach/συλλόγου..."
                value={coachSearch}
                onChange={(e) => searchCoaches(e.target.value)}
                className="pl-10 rounded-none"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableCoaches.map((coach) => (
                <button
                  key={coach.id}
                  onClick={() => handleAddClub(coach.id)}
                  className="w-full flex items-center gap-3 p-3 border border-border rounded-none hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={coach.photo_url || ""} />
                    <AvatarFallback className="rounded-full bg-[#cb8954]/20 text-[#cb8954] text-xs">
                      {coach.name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{coach.name}</p>
                    <p className="text-xs text-muted-foreground">{coach.email}</p>
                  </div>
                </button>
              ))}
              {coachSearch.length >= 2 && availableCoaches.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Δεν βρέθηκαν coaches.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Είστε σίγουροι;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια θα αφαιρέσει τον σύλλογο από την ομοσπονδία σας.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClub} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Αφαίρεση
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default FederationClubs;
