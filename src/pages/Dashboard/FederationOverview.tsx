import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Building2, Users, Activity } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";

const FederationOverview = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const [stats, setStats] = useState({ clubs: 0, athletes: 0, programs: 0 });
  const { t } = useTranslation();

  useEffect(() => {
    if (userProfile?.id) fetchStats();
  }, [userProfile?.id]);

  const fetchStats = async () => {
    if (!userProfile?.id) return;
    const { count: clubsCount } = await supabase
      .from("federation_clubs")
      .select("*", { count: "exact", head: true })
      .eq("federation_id", userProfile.id);

    const { data: clubs } = await supabase
      .from("federation_clubs")
      .select("club_id")
      .eq("federation_id", userProfile.id);

    let athletesCount = 0;
    if (clubs && clubs.length > 0) {
      const clubIds = clubs.map((c) => c.club_id);
      const { count } = await supabase
        .from("app_users")
        .select("*", { count: "exact", head: true })
        .in("coach_id", clubIds)
        .in("role", ["athlete", "general"]);
      athletesCount = count || 0;
    }

    setStats({ clubs: clubsCount || 0, athletes: athletesCount, programs: 0 });
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
                <h1 className="text-lg font-semibold">{t("federation.overview.title")}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t("federation.overview.title")}</h1>
                <p className="text-muted-foreground">
                  {t("federation.overview.welcome")}, {userProfile?.name || t("federation.title")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t("federation.overview.clubs")}</CardTitle>
                  <Building2 className="h-4 w-4 text-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.clubs}</div>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t("federation.overview.athletes")}</CardTitle>
                  <Users className="h-4 w-4 text-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.athletes}</div>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t("federation.overview.activePrograms")}</CardTitle>
                  <Activity className="h-4 w-4 text-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.programs}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-lg">{t("federation.overview.recentActivity")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t("federation.overview.noRecentActivity")}
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationOverview;
