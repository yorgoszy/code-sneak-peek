import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { CoachProvider } from "@/contexts/CoachContext";
import { VideoAnalysisOverview } from "@/components/video-analysis/VideoAnalysisOverview";

const FederationVideoAnalysis = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t } = useTranslation();

  const [clubsList, setClubsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) fetchClubsList();
  }, [userProfile?.id]);

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
                <h1 className="text-lg font-semibold">{t("federation.videoAnalysis.title")}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("federation.videoAnalysis.title")}</h1>
                <p className="text-muted-foreground text-sm">{t("federation.videoAnalysis.subtitle")}</p>
              </div>
            </div>

            <div className="mb-6">
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger className="w-full sm:w-[300px] rounded-none">
                  <SelectValue placeholder={t("federation.videoAnalysis.selectClub")} />
                </SelectTrigger>
                <SelectContent>
                  {clubsList.map((club) => (
                    <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <p className="text-muted-foreground text-center py-8">{t("federation.common.loading")}</p>
            ) : clubsList.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("federation.progress.noClubs")}</p>
            ) : selectedClub ? (
              <CoachProvider overrideCoachId={selectedClub}>
                <VideoAnalysisOverview />
              </CoachProvider>
            ) : null}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationVideoAnalysis;
