import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { UserProgressSection } from "@/components/user-profile/UserProgressSection";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";

const FederationProgress = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t } = useTranslation();

  const [clubsList, setClubsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingAthletes, setLoadingAthletes] = useState(false);

  useEffect(() => {
    if (userProfile?.id) fetchClubsList();
  }, [userProfile?.id]);

  useEffect(() => {
    if (selectedClub) {
      setSelectedUserId("");
      loadClubAthletes(selectedClub);
    }
  }, [selectedClub]);

  const fetchClubsList = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("federation_clubs")
      .select(`club_id, club:app_users!federation_clubs_club_id_fkey ( id, name )`)
      .eq("federation_id", userProfile.id);

    const list = (data || []).map((item: any) => {
      const club = Array.isArray(item.club) ? item.club[0] : item.club;
      return { id: club?.id, name: club?.name };
    }).filter((c: any) => c.id);

    setClubsList(list);
    if (list.length > 0 && !selectedClub) setSelectedClub(list[0].id);
    setLoading(false);
  };

  const loadClubAthletes = async (clubId: string) => {
    setLoadingAthletes(true);
    try {
      // Get athletes belonging to this club/coach
      const { data: athletesList, error } = await supabase
        .from('app_users')
        .select('id, name, email, photo_url, avatar_url')
        .eq('coach_id', clubId);

      if (error) throw error;

      if (!athletesList || athletesList.length === 0) {
        setAthletes([]);
        setLoadingAthletes(false);
        return;
      }

      // Find which athletes have test data
      const [strengthRes, anthropometricRes, enduranceRes, jumpRes, functionalRes] = await Promise.all([
        supabase.from('coach_strength_test_sessions').select('user_id').eq('coach_id', clubId),
        supabase.from('coach_anthropometric_test_sessions').select('user_id').eq('coach_id', clubId),
        supabase.from('coach_endurance_test_sessions').select('user_id').eq('coach_id', clubId),
        supabase.from('coach_jump_test_sessions').select('user_id').eq('coach_id', clubId),
        supabase.from('coach_functional_test_sessions').select('user_id').eq('coach_id', clubId),
      ]);

      const userIdsWithTests = new Set([
        ...(strengthRes.data?.map(u => u.user_id).filter(Boolean) || []),
        ...(anthropometricRes.data?.map(u => u.user_id).filter(Boolean) || []),
        ...(enduranceRes.data?.map(u => u.user_id).filter(Boolean) || []),
        ...(jumpRes.data?.map(u => u.user_id).filter(Boolean) || []),
        ...(functionalRes.data?.map(u => u.user_id).filter(Boolean) || []),
      ]);

      const athletesWithTests = athletesList.filter(u => userIdsWithTests.has(u.id));
      setAthletes(athletesWithTests);
    } catch (error) {
      console.error('Error loading club athletes:', error);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const userOptions = useMemo(() =>
    (athletes || []).map(user => ({
      value: user.id,
      label: user.name,
      searchTerms: `${user.name} ${user.email || ''}`,
      avatarUrl: user.photo_url || user.avatar_url
    })),
    [athletes]
  );

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
                <h1 className="text-lg font-semibold">Athletes Progress</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Athletes Progress</h1>
                <p className="text-muted-foreground text-sm">Παρακολουθήστε την πρόοδο των αθλητών ανά σύλλογο</p>
              </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-4">
              {/* Club selector */}
              <div className="mb-6">
                <Select value={selectedClub} onValueChange={setSelectedClub}>
                  <SelectTrigger className="w-full sm:w-[300px] rounded-none">
                    <SelectValue placeholder={t("federation.progress.selectClub")} />
                  </SelectTrigger>
                  <SelectContent>
                    {clubsList.map((club) => (
                      <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <CustomLoadingScreen />
              ) : clubsList.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t("federation.progress.noClubs")}</p>
              ) : selectedClub ? (
                <>
                  {/* Athlete selector */}
                  <Card className="rounded-none">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Επιλέξτε Αθλητή
                        </label>
                        {loadingAthletes ? (
                          <p className="text-muted-foreground text-sm">Φόρτωση αθλητών...</p>
                        ) : (
                          <Combobox
                            options={userOptions}
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                            placeholder="Αναζήτηση με όνομα ή email..."
                            emptyMessage="Δεν βρέθηκε αθλητής με τεστ."
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Progress section */}
                  {selectedUserId && selectedClub && (
                    <UserProgressSection
                      userId={selectedUserId}
                      useCoachTables={true}
                      coachId={selectedClub}
                    />
                  )}

                  {!selectedUserId && !loadingAthletes && (
                    <Card className="rounded-none">
                      <CardContent className="text-center py-12 text-muted-foreground">
                        {athletes.length === 0
                          ? "Δεν υπάρχουν αθλητές με τεστ σε αυτόν τον σύλλογο"
                          : "Επιλέξτε έναν αθλητή για να δείτε την πρόοδό του"
                        }
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationProgress;
