import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Building2, Users, TrendingUp, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { matchesSearchTerm } from "@/lib/utils";

interface ClubStat {
  clubId: string;
  clubName: string;
  athleteCount: number;
  activePrograms: number;
}

interface AthleteProgress {
  id: string;
  name: string;
  email: string;
  photo_url: string | null;
  avatar_url: string | null;
  coach_name: string;
  completedWorkouts: number;
  totalWorkouts: number;
}

const FederationProgress = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const navigate = useNavigate();

  const [clubStats, setClubStats] = useState<ClubStat[]>([]);
  const [athleteProgress, setAthleteProgress] = useState<AthleteProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [athletesLoading, setAthletesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [clubsList, setClubsList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchClubStats();
      fetchClubsList();
    }
  }, [userProfile?.id]);

  useEffect(() => {
    if (clubsList.length > 0) fetchAthleteProgress();
  }, [clubsList, selectedClub]);

  const fetchClubsList = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase
      .from("federation_clubs")
      .select(`club_id, club:app_users!federation_clubs_club_id_fkey ( id, name )`)
      .eq("federation_id", userProfile.id);
    const list = (data || []).map((item: any) => {
      const club = Array.isArray(item.club) ? item.club[0] : item.club;
      return { id: club?.id, name: club?.name };
    }).filter((c: any) => c.id);
    setClubsList(list);
  };

  const fetchClubStats = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    const { data: fedClubs } = await supabase
      .from("federation_clubs")
      .select(`club_id, club:app_users!federation_clubs_club_id_fkey ( id, name )`)
      .eq("federation_id", userProfile.id);

    const stats: ClubStat[] = await Promise.all(
      (fedClubs || []).map(async (item: any) => {
        const club = Array.isArray(item.club) ? item.club[0] : item.club;
        const { count: athleteCount } = await supabase.from("app_users").select("*", { count: "exact", head: true }).eq("coach_id", item.club_id).in("role", ["athlete", "general"]);
        const { count: programCount } = await supabase.from("program_assignments").select("*", { count: "exact", head: true }).eq("coach_id", item.club_id).eq("status", "active");
        return { clubId: item.club_id, clubName: club?.name || "Άγνωστος", athleteCount: athleteCount || 0, activePrograms: programCount || 0 };
      })
    );
    setClubStats(stats);
    setLoading(false);
  };

  const fetchAthleteProgress = async () => {
    if (!userProfile?.id) return;
    setAthletesLoading(true);
    const clubIds = clubsList.map((c) => c.id);
    if (clubIds.length === 0) { setAthleteProgress([]); setAthletesLoading(false); return; }

    const filterIds = selectedClub !== "all" ? [selectedClub] : clubIds;
    const { data: athletes } = await supabase
      .from("app_users")
      .select("id, name, email, photo_url, avatar_url, coach_id")
      .in("coach_id", filterIds)
      .in("role", ["athlete", "general"])
      .order("name");

    // Get workout completions for each athlete
    const progress: AthleteProgress[] = await Promise.all(
      (athletes || []).map(async (a: any) => {
        const club = clubsList.find((c) => c.id === a.coach_id);

        // Get assignments for this athlete
        const { data: assignments } = await supabase
          .from("program_assignments")
          .select("id, training_dates")
          .eq("user_id", a.id)
          .eq("status", "active");

        let totalWorkouts = 0;
        let completedWorkouts = 0;

        if (assignments && assignments.length > 0) {
          for (const assignment of assignments) {
            totalWorkouts += (assignment.training_dates as string[] || []).length;
            const { count } = await supabase
              .from("workout_completions")
              .select("*", { count: "exact", head: true })
              .eq("assignment_id", assignment.id)
              .eq("status", "completed");
            completedWorkouts += count || 0;
          }
        }

        return {
          id: a.id,
          name: a.name,
          email: a.email,
          photo_url: a.photo_url,
          avatar_url: a.avatar_url,
          coach_name: club?.name || "",
          completedWorkouts,
          totalWorkouts,
        };
      })
    );
    setAthleteProgress(progress);
    setAthletesLoading(false);
  };

  const totalAthletes = clubStats.reduce((sum, c) => sum + c.athleteCount, 0);
  const totalPrograms = clubStats.reduce((sum, c) => sum + c.activePrograms, 0);

  const filteredAthletes = athleteProgress.filter((a) => {
    if (!searchQuery) return true;
    return matchesSearchTerm(a.name, searchQuery) || matchesSearchTerm(a.email, searchQuery);
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
              <h1 className="text-lg font-semibold">Πρόοδος</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground">Πρόοδος</h1>
              <p className="text-muted-foreground text-sm">Στατιστικά ανά σύλλογο και πρόοδος αθλητών</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Σύνολο Συλλόγων</CardTitle>
                  <Building2 className="h-4 w-4 text-[#cb8954]" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{clubStats.length}</div></CardContent>
              </Card>
              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Σύνολο Αθλητών</CardTitle>
                  <Users className="h-4 w-4 text-[#00ffba]" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalAthletes}</div></CardContent>
              </Card>
              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ενεργά Προγράμματα</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#aca097]" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalPrograms}</div></CardContent>
              </Card>
            </div>

            {/* Per-Club Stats Table */}
            <Card className="rounded-none mb-6">
              <CardHeader><CardTitle className="text-lg">Ανά Σύλλογο</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Φόρτωση...</p>
                ) : clubStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Δεν υπάρχουν σύλλογοι.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Σύλλογος</th>
                          <th className="text-center py-3 px-2 font-medium text-muted-foreground">Αθλητές</th>
                          <th className="text-center py-3 px-2 font-medium text-muted-foreground">Ενεργά Προγράμματα</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clubStats.map((stat) => (
                          <tr key={stat.clubId} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-2 font-medium">{stat.clubName}</td>
                            <td className="py-3 px-2 text-center">{stat.athleteCount}</td>
                            <td className="py-3 px-2 text-center">{stat.activePrograms}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Athlete Progress */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-lg">Πρόοδος Αθλητών</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Αναζήτηση αθλητή..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-none" />
                  </div>
                  <Select value={selectedClub} onValueChange={setSelectedClub}>
                    <SelectTrigger className="w-full sm:w-[200px] rounded-none">
                      <SelectValue placeholder="Όλοι οι σύλλογοι" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Όλοι οι σύλλογοι</SelectItem>
                      {clubsList.map((club) => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {athletesLoading ? (
                  <p className="text-muted-foreground text-center py-4">Φόρτωση...</p>
                ) : filteredAthletes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Δεν βρέθηκαν αθλητές.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredAthletes.map((athlete) => {
                      const progressPct = athlete.totalWorkouts > 0 ? Math.round((athlete.completedWorkouts / athlete.totalWorkouts) * 100) : 0;
                      return (
                        <div key={athlete.id} className="flex items-center gap-3 p-3 border border-border rounded-none hover:bg-muted/50 transition-colors">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={athlete.photo_url || athlete.avatar_url || ""} />
                            <AvatarFallback className="rounded-full bg-[#00ffba]/20 text-[#00ffba] text-xs">
                              {athlete.name?.charAt(0) || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{athlete.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{athlete.coach_name}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs font-medium">{athlete.completedWorkouts}/{athlete.totalWorkouts}</p>
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-[#00ffba] transition-all" style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-none"
                              onClick={() => navigate(`/dashboard/user-profile/${athlete.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationProgress;
