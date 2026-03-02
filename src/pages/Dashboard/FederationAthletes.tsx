import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Users, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Athlete {
  id: string;
  name: string;
  email: string;
  photo_url: string | null;
  role: string;
  coach_name?: string;
  coach_id?: string;
}

const FederationAthletes = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchClubs();
      fetchAthletes();
    }
  }, [userProfile?.id]);

  const fetchClubs = async () => {
    if (!userProfile?.id) return;

    const { data } = await supabase
      .from("federation_clubs")
      .select(`
        club_id,
        club:app_users!federation_clubs_club_id_fkey ( id, name )
      `)
      .eq("federation_id", userProfile.id);

    const clubList = (data || []).map((item: any) => {
      const club = Array.isArray(item.club) ? item.club[0] : item.club;
      return { id: club?.id, name: club?.name };
    }).filter(c => c.id);

    setClubs(clubList);
  };

  const fetchAthletes = async (clubFilter?: string) => {
    if (!userProfile?.id) return;
    setLoading(true);

    // Get federation's club IDs
    const { data: fedClubs } = await supabase
      .from("federation_clubs")
      .select("club_id")
      .eq("federation_id", userProfile.id);

    const clubIds = (fedClubs || []).map((c) => c.club_id);
    if (clubIds.length === 0) {
      setAthletes([]);
      setLoading(false);
      return;
    }

    const filterIds = clubFilter && clubFilter !== "all" ? [clubFilter] : clubIds;

    const { data } = await supabase
      .from("app_users")
      .select("id, name, email, photo_url, role, coach_id")
      .in("coach_id", filterIds)
      .in("role", ["athlete", "general"])
      .order("name");

    // Map coach names
    const athletesWithCoach = (data || []).map((a) => {
      const club = clubs.find((c) => c.id === a.coach_id);
      return { ...a, coach_name: club?.name || "" };
    });

    setAthletes(athletesWithCoach);
    setLoading(false);
  };

  useEffect(() => {
    if (userProfile?.id && clubs.length > 0) {
      fetchAthletes(selectedClub);
    }
  }, [selectedClub, clubs]);

  const filteredAthletes = athletes.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const name = a.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const email = a.email.toLowerCase();
    return name.includes(q) || email.includes(q);
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
                <h1 className="text-lg font-semibold">Αθλητές</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground">Αθλητές</h1>
              <p className="text-muted-foreground text-sm">
                Αθλητές από όλους τους συλλόγους της ομοσπονδίας
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Αναζήτηση αθλητή..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-none"
                />
              </div>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger className="w-full sm:w-[200px] rounded-none">
                  <SelectValue placeholder="Όλοι οι σύλλογοι" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλοι οι σύλλογοι</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Athletes List */}
            <div className="grid gap-2">
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Φόρτωση...</p>
              ) : filteredAthletes.length === 0 ? (
                <Card className="rounded-none">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-3 opacity-30" />
                    <p>Δεν βρέθηκαν αθλητές.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAthletes.map((athlete) => (
                  <Card key={athlete.id} className="rounded-none hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={athlete.photo_url || ""} />
                          <AvatarFallback className="rounded-full bg-[#00ffba]/20 text-[#00ffba] text-xs">
                            {athlete.name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{athlete.name}</p>
                          <p className="text-xs text-muted-foreground">{athlete.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {athlete.coach_name}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none"
                          onClick={() => navigate(`/dashboard/user-profile/${athlete.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Σύνολο: {filteredAthletes.length} αθλητές
            </p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationAthletes;
