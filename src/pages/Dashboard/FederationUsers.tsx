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
  const { t, i18n } = useTranslation();
  const language = i18n.language;

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
  const [newClubName, setNewClubName] = useState("");
  const [newClubEmail, setNewClubEmail] = useState("");
  const [newClubPhone, setNewClubPhone] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [emailExistsNoMatch, setEmailExistsNoMatch] = useState<any | null>(null);
  const [clubsList, setClubsList] = useState<{ id: string; name: string }[]>([]);
  const [newClubPhoto, setNewClubPhoto] = useState<string>("");
  const [matchedExistingId, setMatchedExistingId] = useState<string | null>(null);

  // Add Athlete dialog state
  const [addAthleteDialogOpen, setAddAthleteDialogOpen] = useState(false);
  const [newAthName, setNewAthName] = useState("");
  const [newAthEmail, setNewAthEmail] = useState("");
  const [newAthPhone, setNewAthPhone] = useState("");
  const [newAthPhoto, setNewAthPhoto] = useState("");
  const [newAthClubId, setNewAthClubId] = useState<string>("");
  const [creatingAthlete, setCreatingAthlete] = useState(false);
  const [athMatched, setAthMatched] = useState<any[]>([]);
  const [athShowMatch, setAthShowMatch] = useState(false);
  const [athMatchedExistingId, setAthMatchedExistingId] = useState<string | null>(null);
  const [athEmailExists, setAthEmailExists] = useState<any | null>(null);

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
    setAddDialogOpen(false); resetAddForm(); fetchClubs(); fetchClubsList();
  };

  const resetAddForm = () => {
    setNewClubName(""); setNewClubEmail(""); setNewClubPhone(""); setNewClubPhoto("");
    setMatchedUsers([]); setShowMatchPopup(false); setMatchedExistingId(null);
    setEmailExistsNoMatch(null);
  };

  const searchByField = async (value: string) => {
    if (value.trim().length < 2) { setMatchedUsers([]); setShowMatchPopup(false); setEmailExistsNoMatch(null); return; }
    const { data, error } = await supabase.rpc('find_user_by_contact', { _query: value.trim() });
    if (error) { console.error('find_user_by_contact error', error); return; }
    const existingClubIds = clubs.map((c) => c.club_id);
    const filtered = (data || []).filter((u: any) => !existingClubIds.includes(u.id) && u.id !== userProfile?.id);
    setMatchedUsers(filtered);
    setShowMatchPopup(filtered.length > 0);

    if (value.includes('@')) {
      const exact = (data || []).find((u: any) => u.email?.toLowerCase() === value.trim().toLowerCase());
      setEmailExistsNoMatch(exact && !filtered.some((f: any) => f.id === exact.id) ? exact : null);
    } else {
      setEmailExistsNoMatch(null);
    }
  };

  const handleEmailChange = (val: string) => {
    setNewClubEmail(val); setMatchedExistingId(null); searchByField(val);
  };
  const handleNameChange = (val: string) => {
    setNewClubName(val); setMatchedExistingId(null); searchByField(val);
  };
  const handleSelectMatch = (user: any) => {
    setNewClubName(user.name || "");
    setNewClubEmail(user.email || "");
    setNewClubPhone(user.phone || "");
    setNewClubPhoto(user.photo_url || user.avatar_url || "");
    setMatchedExistingId(user.id);
    setMatchedUsers([]); setShowMatchPopup(false); setEmailExistsNoMatch(null);
  };

  // ===== Athlete add helpers =====
  const resetAthleteForm = () => {
    setNewAthName(""); setNewAthEmail(""); setNewAthPhone(""); setNewAthPhoto("");
    setNewAthClubId(""); setAthMatched([]); setAthShowMatch(false);
    setAthMatchedExistingId(null); setAthEmailExists(null);
  };

  const searchAthleteByField = async (value: string) => {
    if (value.trim().length < 2) { setAthMatched([]); setAthShowMatch(false); setAthEmailExists(null); return; }
    const { data, error } = await supabase.rpc('find_user_by_contact', { _query: value.trim() });
    if (error) { console.error(error); return; }
    setAthMatched(data || []);
    setAthShowMatch((data || []).length > 0);
    if (value.includes('@')) {
      const exact = (data || []).find((u: any) => u.email?.toLowerCase() === value.trim().toLowerCase());
      setAthEmailExists(exact || null);
    } else {
      setAthEmailExists(null);
    }
  };

  const handleAthEmailChange = (val: string) => {
    setNewAthEmail(val); setAthMatchedExistingId(null); searchAthleteByField(val);
  };
  const handleAthNameChange = (val: string) => {
    setNewAthName(val); setAthMatchedExistingId(null); searchAthleteByField(val);
  };
  const handleSelectAthMatch = (user: any) => {
    setNewAthName(user.name || "");
    setNewAthEmail(user.email || "");
    setNewAthPhone(user.phone || "");
    setNewAthPhoto(user.photo_url || user.avatar_url || "");
    setAthMatchedExistingId(user.id);
    setAthMatched([]); setAthShowMatch(false); setAthEmailExists(null);
  };

  const handleCreateAthlete = async () => {
    if (!userProfile?.id || !newAthName.trim() || !newAthEmail.trim() || !newAthClubId) {
      toast({ variant: "destructive", title: t("federation.common.error"), description: language === 'el' ? 'Συμπληρώστε όνομα, email και επιλέξτε σύλλογο' : 'Fill name, email and select club' });
      return;
    }
    setCreatingAthlete(true);
    try {
      let existingId = athMatchedExistingId;
      if (!existingId) {
        const { data: existing } = await supabase.rpc('find_user_by_contact', { _query: newAthEmail.trim() });
        const exact = (existing || []).find((u: any) => u.email?.toLowerCase() === newAthEmail.trim().toLowerCase());
        existingId = exact?.id || null;
      }

      if (existingId) {
        const { error: assignErr } = await supabase.rpc('federation_assign_athlete', {
          _user_id: existingId, _club_id: newAthClubId,
        });
        if (assignErr) {
          console.error('assign athlete error', assignErr);
          toast({ variant: "destructive", title: t("federation.common.error"), description: assignErr.message });
          setCreatingAthlete(false); return;
        }
      } else {
        const { error: insErr } = await supabase.from("app_users").insert({
          name: newAthName.trim(),
          email: newAthEmail.trim(),
          phone: newAthPhone.trim() || null,
          photo_url: newAthPhoto || null,
          role: "athlete",
          coach_id: newAthClubId,
          user_status: "active",
        });
        if (insErr) {
          console.error('insert athlete error', insErr);
          toast({ variant: "destructive", title: t("federation.common.error"), description: insErr.message });
          setCreatingAthlete(false); return;
        }
      }

      toast({ title: t("federation.common.success"), description: language === 'el' ? 'Ο αθλητής προστέθηκε' : 'Athlete added' });
      setAddAthleteDialogOpen(false); resetAthleteForm(); fetchAthletes(); fetchClubs();
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: t("federation.common.error"), description: err.message });
    } finally {
      setCreatingAthlete(false);
    }
  };

  const handleCreateClub = async () => {
    if (!userProfile?.id || !newClubName.trim() || !newClubEmail.trim()) {
      toast({ variant: "destructive", title: t("federation.common.error"), description: language === 'el' ? 'Συμπληρώστε όνομα και email' : 'Fill name and email' });
      return;
    }
    setCreatingClub(true);
    try {
      // Prefer explicitly matched existing user if user clicked on a suggestion
      let existingId = matchedExistingId;
      if (!existingId) {
        const { data: existing } = await supabase.from("app_users")
          .select("id").eq("email", newClubEmail.trim()).maybeSingle();
        existingId = existing?.id || null;
      }

      if (existingId) {
        await handleAddClub(existingId);
        setCreatingClub(false);
        return;
      }

      const { data: newCoach, error: createError } = await supabase.from("app_users")
        .insert({
          name: newClubName.trim(),
          email: newClubEmail.trim(),
          phone: newClubPhone.trim() || null,
          photo_url: newClubPhoto || null,
          role: "coach",
          user_status: "active",
        })
        .select("id").single();

      if (createError) {
        console.error('❌ Create coach error:', createError);
        toast({ variant: "destructive", title: t("federation.common.error"), description: createError.message });
        setCreatingClub(false); return;
      }

      const { error: linkError } = await supabase.from("federation_clubs")
        .insert({ federation_id: userProfile.id, club_id: newCoach.id });
      if (linkError) {
        console.error('❌ Link club error:', linkError);
        toast({ variant: "destructive", title: t("federation.common.error"), description: linkError.message });
        setCreatingClub(false); return;
      }

      toast({ title: t("federation.common.success"), description: t("federation.users.clubAdded") });
      setAddDialogOpen(false); resetAddForm(); fetchClubs(); fetchClubsList();
    } catch (err: any) {
      console.error('❌ handleCreateClub exception:', err);
      toast({ variant: "destructive", title: t("federation.common.error"), description: err.message });
    } finally {
      setCreatingClub(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!clubToDelete) return;
    const { error } = await supabase.from("federation_clubs").delete().eq("id", clubToDelete);
    if (error) { toast({ variant: "destructive", title: t("federation.common.error") }); }
    else { toast({ title: t("federation.common.success"), description: t("federation.users.clubRemoved") }); fetchClubs(); fetchClubsList(); }
    setDeleteDialogOpen(false); setClubToDelete(null);
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
                  <Button onClick={() => setAddAthleteDialogOpen(true)} className="rounded-none bg-foreground hover:bg-foreground/90 text-background" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {language === 'el' ? 'Προσθήκη Αθλητή' : 'Add Athlete'}
                  </Button>
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

      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetAddForm(); }}>
        <DialogContent className="rounded-none">
          <DialogHeader><DialogTitle>{t("federation.users.addClubDialog")}</DialogTitle></DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2 relative">
              <Label>{language === 'el' ? 'Όνομα Συλλόγου' : 'Club Name'} *</Label>
              <Input value={newClubName} onChange={(e) => handleNameChange(e.target.value)} className="rounded-none" placeholder={language === 'el' ? 'π.χ. Α.Σ. Ολυμπιακός' : 'e.g. Olympic Club'} />
            </div>
            <div className="space-y-2 relative">
              <Label>Email *</Label>
              <Input type="email" value={newClubEmail} onChange={(e) => handleEmailChange(e.target.value)} className="rounded-none" placeholder="club@email.com" />
            </div>

            {showMatchPopup && matchedUsers.length > 0 && (
              <div className="border border-border rounded-none bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">
                  {language === 'el' ? '⚠️ Βρέθηκαν υπάρχοντες χρήστες - θέλετε να αντληθούν τα στοιχεία;' : '⚠️ Existing users found - use their details?'}
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {matchedUsers.map((user) => (
                    <button key={user.id} onClick={() => handleSelectMatch(user)}
                      className="w-full flex items-center gap-3 p-2 border border-border rounded-none hover:bg-muted transition-colors text-left">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.photo_url || ""} />
                        <AvatarFallback className="rounded-full bg-muted text-foreground text-xs">{user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email} · {user.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="rounded-none text-xs" onClick={() => setShowMatchPopup(false)}>
                  {language === 'el' ? 'Αγνόηση' : 'Dismiss'}
                </Button>
              </div>
            )}

            {emailExistsNoMatch && !matchedExistingId && (
              <div className="border border-border rounded-none bg-muted p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">
                  {language === 'el'
                    ? `⚠️ Το email υπάρχει ήδη στη βάση (ρόλος: ${emailExistsNoMatch.role}). Θέλετε να αντληθούν τα στοιχεία;`
                    : `⚠️ This email already exists (role: ${emailExistsNoMatch.role}). Use existing details?`}
                </p>
                <button onClick={() => handleSelectMatch(emailExistsNoMatch)}
                  className="w-full flex items-center gap-3 p-2 border border-border rounded-none hover:bg-muted transition-colors text-left bg-background">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={emailExistsNoMatch.photo_url || emailExistsNoMatch.avatar_url || ""} />
                    <AvatarFallback className="rounded-full bg-muted text-foreground text-xs">{emailExistsNoMatch.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{emailExistsNoMatch.name}</p>
                    <p className="text-xs text-muted-foreground">{emailExistsNoMatch.email} · {emailExistsNoMatch.role}</p>
                  </div>
                </button>
              </div>
            )}

            <div className="space-y-2">
              <Label>{language === 'el' ? 'Τηλέφωνο' : 'Phone'}</Label>
              <Input value={newClubPhone} onChange={(e) => setNewClubPhone(e.target.value)} className="rounded-none" placeholder={language === 'el' ? 'Προαιρετικό' : 'Optional'} />
            </div>

            {(newClubPhoto || matchedExistingId) && (
              <div className="flex items-center gap-3 p-2 border border-border rounded-none bg-muted/30">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={newClubPhoto || ""} />
                  <AvatarFallback className="rounded-full bg-muted text-foreground text-xs">{newClubName?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="text-xs text-muted-foreground">
                  {language === 'el' ? 'Στοιχεία από υπάρχοντα χρήστη' : 'Details from existing user'}
                </div>
              </div>
            )}

            <Button onClick={handleCreateClub} disabled={creatingClub || !newClubName.trim() || !newClubEmail.trim()} className="w-full rounded-none bg-foreground hover:bg-foreground/90 text-background">
              <Plus className="h-4 w-4 mr-2" />
              {creatingClub ? (language === 'el' ? 'Δημιουργία...' : 'Creating...') : (language === 'el' ? 'Προσθήκη Συλλόγου' : 'Add Club')}
            </Button>
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
