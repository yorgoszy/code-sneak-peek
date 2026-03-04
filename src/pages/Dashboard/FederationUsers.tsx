import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Users, Search, Eye, Building2, Plus, Trash2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { matchesSearchTerm } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Athlete {
  id: string; name: string; email: string; photo_url: string | null;
  avatar_url: string | null; role: string; coach_name?: string; coach_id?: string;
}

interface Club {
  id: string; club_id: string;
  club: { id: string; name: string; email: string; photo_url: string | null };
  athleteCount?: number;
}

const FederationUsers = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(true);
  const [athleteSearch, setAthleteSearch] = useState("");
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>("all");

  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubSearch, setClubSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<'search' | 'create'>('search');
  const [coachSearch, setCoachSearch] = useState("");
  const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
  const [newClubName, setNewClubName] = useState("");
  const [newClubEmail, setNewClubEmail] = useState("");
  const [newClubPhone, setNewClubPhone] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);
  const [clubsList, setClubsList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (userProfile?.id) { fetchClubs(); fetchClubsList(); }
  }, [userProfile?.id]);

  useEffect(() => {
    if (userProfile?.id && clubsList.length > 0) fetchAthletes();
  }, [clubsList, selectedClubFilter]);

  const fetchClubsList = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase.from("federation_clubs")
      .select(`club_id, club:app_users!federation_clubs_club_id_fkey ( id, name )`)
      .eq("federation_id", userProfile.id);
    const list = (data || []).map((item: any) => {
      const club = Array.isArray(item.club) ? item.club[0] : item.club;
      return { id: club?.id, name: club?.name };
    }).filter((c: any) => c.id);
    setClubsList(list);
  };

  const fetchClubs = async () => {
    if (!userProfile?.id) return;
    setClubsLoading(true);
    const { data, error } = await supabase.from("federation_clubs")
      .select(`id, club_id, club:app_users!federation_clubs_club_id_fkey ( id, name, email, photo_url )`)
      .eq("federation_id", userProfile.id);
    if (error) { setClubsLoading(false); return; }
    const clubsWithCounts = await Promise.all(
      (data || []).map(async (item: any) => {
        const { count } = await supabase.from("app_users").select("*", { count: "exact", head: true })
          .eq("coach_id", item.club_id).in("role", ["athlete", "general"]);
        return { ...item, club: Array.isArray(item.club) ? item.club[0] : item.club, athleteCount: count || 0 };
      })
    );
    setClubs(clubsWithCounts);
    setClubsLoading(false);
  };

  const fetchAthletes = async () => {
    if (!userProfile?.id) return;
    setAthletesLoading(true);
    const clubIds = clubsList.map((c) => c.id);
    if (clubIds.length === 0) { setAthletes([]); setAthletesLoading(false); return; }
    const filterIds = selectedClubFilter !== "all" ? [selectedClubFilter] : clubIds;
    const { data } = await supabase.from("app_users")
      .select("id, name, email, photo_url, avatar_url, role, coach_id")
      .in("coach_id", filterIds).in("role", ["athlete", "general"]).order("name");
    const athletesWithCoach = (data || []).map((a: any) => {
      const club = clubsList.find((c) => c.id === a.coach_id);
      return { ...a, coach_name: club?.name || "" };
    });
    setAthletes(athletesWithCoach);
    setAthletesLoading(false);
  };

  const handleAddClub = async (coachId: string) => {
    if (!userProfile?.id) return;
    const { error } = await supabase.from("federation_clubs").insert({ federation_id: userProfile.id, club_id: coachId });
    if (error) { toast({ variant: "destructive", title: t("federation.common.error"), description: t("federation.users.clubExists") }); return; }
    toast({ title: t("federation.common.success"), description: t("federation.users.clubAdded") });
    setAddDialogOpen(false); setCoachSearch(""); fetchClubs(); fetchClubsList();
  };

  const handleDeleteClub = async () => {
    if (!clubToDelete) return;
    const { error } = await supabase.from("federation_clubs").delete().eq("id", clubToDelete);
    if (error) { toast({ variant: "destructive", title: t("federation.common.error") }); }
    else { toast({ title: t("federation.common.success"), description: t("federation.users.clubRemoved") }); fetchClubs(); fetchClubsList(); }
    setDeleteDialogOpen(false); setClubToDelete(null);
  };

  const searchCoaches = async (query: string) => {
    setCoachSearch(query);
    if (query.length < 2) { setAvailableCoaches([]); return; }
    const { data } = await supabase.from("app_users").select("id, name, email, photo_url")
      .eq("role", "coach").or(`name.ilike.%${query}%,email.ilike.%${query}%`).limit(10);
    const existingClubIds = clubs.map((c) => c.club_id);
    setAvailableCoaches((data || []).filter((c: any) => !existingClubIds.includes(c.id)));
  };

  const filteredClubs = clubs.filter((c) => {
    if (!clubSearch) return true;
    const q = clubSearch.toLowerCase();
    return c.club?.name?.toLowerCase().includes(q) || c.club?.email?.toLowerCase().includes(q);
  });

  const filteredAthletes = athletes.filter((a) => {
    if (!athleteSearch) return true;
    return matchesSearchTerm(a.name, athleteSearch) || matchesSearchTerm(a.email, athleteSearch);
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
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">{t("federation.users.title")}</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground">{t("federation.users.title")}</h1>
              <p className="text-muted-foreground text-sm">{t("federation.users.subtitle")}</p>
            </div>

            <Tabs defaultValue="clubs" className="w-full">
              <TabsList className="rounded-none w-full sm:w-auto">
                <TabsTrigger value="clubs" className="rounded-none flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t("federation.users.clubsTab")} ({clubs.length})
                </TabsTrigger>
                <TabsTrigger value="athletes" className="rounded-none flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("federation.users.athletesTab")} ({athletes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clubs" className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("federation.users.searchClub")} value={clubSearch} onChange={(e) => setClubSearch(e.target.value)} className="pl-10 rounded-none" />
                  </div>
                  <Button onClick={() => setAddDialogOpen(true)} className="rounded-none bg-foreground hover:bg-foreground/90 text-background" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("federation.users.addClub")}
                  </Button>
                </div>

                <div className="grid gap-3">
                  {clubsLoading ? (
                    <p className="text-muted-foreground text-center py-8">{t("federation.common.loading")}</p>
                  ) : filteredClubs.length === 0 ? (
                    <Card className="rounded-none">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Building2 className="mx-auto h-12 w-12 mb-3 opacity-30" />
                        <p>{t("federation.users.noClubsFound")}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredClubs.map((club) => (
                      <Card key={club.id} className="rounded-none hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={club.club?.photo_url || ""} />
                              <AvatarFallback className="bg-muted text-foreground rounded-none">
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
                              <p className="text-xs text-muted-foreground">{t("federation.users.athletesCount")}</p>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-none text-destructive hover:bg-destructive/10"
                              onClick={() => { setClubToDelete(club.id); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="athletes" className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("federation.users.searchAthlete")} value={athleteSearch} onChange={(e) => setAthleteSearch(e.target.value)} className="pl-10 rounded-none" />
                  </div>
                  <Select value={selectedClubFilter} onValueChange={setSelectedClubFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] rounded-none">
                      <SelectValue placeholder={t("federation.users.allClubs")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("federation.users.allClubs")}</SelectItem>
                      {clubsList.map((club) => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  {athletesLoading ? (
                    <p className="text-muted-foreground text-center py-8">{t("federation.common.loading")}</p>
                  ) : filteredAthletes.length === 0 ? (
                    <Card className="rounded-none">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Users className="mx-auto h-12 w-12 mb-3 opacity-30" />
                        <p>{t("federation.users.noAthletesFound")}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredAthletes.map((athlete) => (
                      <Card key={athlete.id} className="rounded-none hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={athlete.photo_url || athlete.avatar_url || ""} />
                              <AvatarFallback className="rounded-full bg-muted text-foreground text-xs">
                                {athlete.name?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{athlete.name}</p>
                              <p className="text-xs text-muted-foreground">{athlete.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground hidden sm:block">{athlete.coach_name}</span>
                            <Button variant="outline" size="sm" className="rounded-none"
                              onClick={() => navigate(`/dashboard/user-profile/${athlete.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t("federation.users.total")}: {filteredAthletes.length} {t("federation.users.athletesCount")}</p>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader><DialogTitle>{t("federation.users.addClubDialog")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("federation.users.searchCoach")} value={coachSearch} onChange={(e) => searchCoaches(e.target.value)} className="pl-10 rounded-none" />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableCoaches.map((coach) => (
                <button key={coach.id} onClick={() => handleAddClub(coach.id)}
                  className="w-full flex items-center gap-3 p-3 border border-border rounded-none hover:bg-muted transition-colors text-left">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={coach.photo_url || ""} />
                    <AvatarFallback className="rounded-full bg-muted text-foreground text-xs">{coach.name?.charAt(0) || "C"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{coach.name}</p>
                    <p className="text-xs text-muted-foreground">{coach.email}</p>
                  </div>
                </button>
              ))}
              {coachSearch.length >= 2 && availableCoaches.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">{t("federation.users.noCoachesFound")}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("federation.users.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("federation.users.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t("federation.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClub} className="bg-destructive hover:bg-destructive/90 rounded-none">{t("federation.users.remove")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default FederationUsers;
