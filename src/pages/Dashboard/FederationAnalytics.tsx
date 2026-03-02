import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Building2, Users, TrendingUp } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";

interface ClubStat {
  clubId: string;
  clubName: string;
  athleteCount: number;
  activePrograms: number;
}

const FederationAnalytics = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const [clubStats, setClubStats] = useState<ClubStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) fetchAnalytics();
  }, [userProfile?.id]);

  const fetchAnalytics = async () => {
    if (!userProfile?.id) return;
    setLoading(true);

    const { data: fedClubs } = await supabase
      .from("federation_clubs")
      .select(`
        club_id,
        club:app_users!federation_clubs_club_id_fkey ( id, name )
      `)
      .eq("federation_id", userProfile.id);

    const stats: ClubStat[] = await Promise.all(
      (fedClubs || []).map(async (item: any) => {
        const club = Array.isArray(item.club) ? item.club[0] : item.club;

        const { count: athleteCount } = await supabase
          .from("app_users")
          .select("*", { count: "exact", head: true })
          .eq("coach_id", item.club_id)
          .in("role", ["athlete", "general"]);

        const { count: programCount } = await supabase
          .from("program_assignments")
          .select("*", { count: "exact", head: true })
          .eq("coach_id", item.club_id)
          .eq("status", "active");

        return {
          clubId: item.club_id,
          clubName: club?.name || "Άγνωστος",
          athleteCount: athleteCount || 0,
          activePrograms: programCount || 0,
        };
      })
    );

    setClubStats(stats);
    setLoading(false);
  };

  const totalAthletes = clubStats.reduce((sum, c) => sum + c.athleteCount, 0);
  const totalPrograms = clubStats.reduce((sum, c) => sum + c.activePrograms, 0);

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
                <h1 className="text-lg font-semibold">Στατιστικά</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground">Στατιστικά Ομοσπονδίας</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Σύνολο Συλλόγων</CardTitle>
                  <Building2 className="h-4 w-4 text-[#cb8954]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clubStats.length}</div>
                </CardContent>
              </Card>
              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Σύνολο Αθλητών</CardTitle>
                  <Users className="h-4 w-4 text-[#00ffba]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAthletes}</div>
                </CardContent>
              </Card>
              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ενεργά Προγράμματα</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#aca097]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPrograms}</div>
                </CardContent>
              </Card>
            </div>

            {/* Per-Club Table */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-lg">Ανά Σύλλογο</CardTitle>
              </CardHeader>
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationAnalytics;
