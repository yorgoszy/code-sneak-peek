import React, { useState, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { SubscriptionManagement } from "@/components/subscriptions/SubscriptionManagement";
import { SubscriptionHistory } from "@/components/subscriptions/SubscriptionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Club {
  id: string;
  name: string;
}

const FederationSubscriptions = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { userProfile } = useRoleCheck();

  useEffect(() => {
    if (userProfile?.id) {
      fetchClubs();
    }
  }, [userProfile?.id]);

  const fetchClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("federation_clubs")
        .select(`club_id, club:app_users!federation_clubs_club_id_fkey ( id, name )`)
        .eq("federation_id", userProfile!.id);

      if (error) throw error;

      const clubsList: Club[] = (data || [])
        .filter((item: any) => item.club)
        .map((item: any) => ({
          id: item.club.id,
          name: item.club.name,
        }));

      setClubs(clubsList);
      if (clubsList.length > 0) {
        setSelectedClub(clubsList[0].id);
      }
    } catch (error) {
      console.error("Error fetching clubs:", error);
      toast.error("Σφάλμα φόρτωσης συλλόγων");
    } finally {
      setLoading(false);
    }
  };

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">
          {renderSidebar()}
        </div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">
              {renderSidebar()}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Συνδρομές</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Συνδρομές</h1>
                <p className="text-muted-foreground">Εποπτεία συνδρομών των συλλόγων σας</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">Επιλογή Συλλόγου</label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger className="w-full max-w-sm rounded-none">
                  <SelectValue placeholder="Επιλέξτε σύλλογο..." />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id} className="rounded-none">
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto" />
                <p className="mt-2 text-muted-foreground">Φόρτωση...</p>
              </div>
            ) : !selectedClub ? (
              <div className="text-center py-12 text-muted-foreground">
                Επιλέξτε σύλλογο για να δείτε τις συνδρομές
              </div>
            ) : (
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="flex w-full justify-start mb-6 rounded-none h-auto flex-wrap gap-2">
                  <TabsTrigger value="active" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Ενεργές Συνδρομές</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-none whitespace-nowrap text-xs sm:text-sm">Ιστορικό</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <SubscriptionManagement />
                </TabsContent>

                <TabsContent value="history">
                  <SubscriptionHistory />
                </TabsContent>
              </Tabs>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationSubscriptions;
