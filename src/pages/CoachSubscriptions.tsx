import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Search, Menu, CreditCard, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { matchesSearchTerm } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { SubscriptionTypesTab } from "@/components/coach/subscriptions/SubscriptionTypesTab";
import { NewSubscriptionDialog } from "@/components/coach/subscriptions/NewSubscriptionDialog";

interface CoachSubscription {
  id: string;
  coach_user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  is_paused: boolean;
  notes: string | null;
  created_at: string;
  subscription_types?: {
    name: string;
    price: number;
  } | null;
  coach_users?: {
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

const CoachSubscriptions = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [searchParams] = useSearchParams();

  const coachIdParam = searchParams.get("coachId");
  const isAdminViewingCoach = !!coachIdParam && isAdmin() && coachIdParam !== userProfile?.id;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isMobile = useIsMobile();
  const [subscriptions, setSubscriptions] = useState<CoachSubscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [newSubscriptionOpen, setNewSubscriptionOpen] = useState(false);

  const effectiveCoachId = useMemo(() => {
    if (coachIdParam && isAdmin() && coachIdParam !== userProfile?.id) return coachIdParam;
    return userProfile?.id ?? null;
  }, [coachIdParam, isAdmin, userProfile?.id]);

  useEffect(() => {
    const checkTabletSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkTabletSize();
    window.addEventListener("resize", checkTabletSize);
    return () => window.removeEventListener("resize", checkTabletSize);
  }, []);

  const fetchSubscriptions = async () => {
    if (loadingSubscriptions || !effectiveCoachId) return;

    setLoadingSubscriptions(true);
    try {
      const { data, error } = await supabase
        .from("coach_subscriptions")
        .select(`
          *,
          subscription_types (name, price),
          coach_users (name, email, avatar_url)
        `)
        .eq("coach_id", effectiveCoachId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching subscriptions:", error);
        toast.error("Σφάλμα κατά τη φόρτωση συνδρομών");
        return;
      }

      setSubscriptions(data || []);
    } catch (error) {
      console.error("💥 Error:", error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    if (!rolesLoading && effectiveCoachId) {
      fetchSubscriptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, effectiveCoachId]);

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Φόρτωση...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const getStatusColor = (status: string, isPaused: boolean) => {
    if (isPaused) return "bg-yellow-100 text-yellow-800";
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string, isPaused: boolean) => {
    if (isPaused) return "Σε παύση";
    switch (status.toLowerCase()) {
      case "active":
        return "Ενεργή";
      case "expired":
        return "Ληγμένη";
      case "cancelled":
        return "Ακυρωμένη";
      default:
        return status;
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const userName = sub.coach_users?.name || "";
    const userEmail = sub.coach_users?.email || "";
    return matchesSearchTerm(userName, searchTerm) || matchesSearchTerm(userEmail, searchTerm);
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: el });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <CoachSidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            contextCoachId={isAdminViewingCoach ? coachIdParam : undefined}
          />
        </div>

        {/* Mobile/Tablet Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="absolute left-0 top-0 h-full bg-white shadow-xl">
              <CoachSidebar
                isCollapsed={false}
                setIsCollapsed={() => {}}
                contextCoachId={isAdminViewingCoach ? coachIdParam : undefined}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile/Tablet header */}
          {(isMobile || isTablet) && (
            <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-4 shadow-sm lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    onClick={() => setShowMobileSidebar(true)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <h1 className="ml-4 text-lg font-semibold text-gray-900">Συνδρομές</h1>
                </div>
                <Button variant="outline" size="sm" className="rounded-none" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          )}

          {/* Desktop Top Navigation */}
          {!(isMobile || isTablet) && (
            <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">Συνδρομές</h1>
                  <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                    Διαχείριση συνδρομών αθλητών
                  </p>
                </div>
                <div className="flex items-center space-x-2 lg:space-x-4">
                  <div className="hidden md:flex items-center text-xs lg:text-sm text-gray-600">
                    <span className="truncate max-w-32 lg:max-w-none">
                      {userProfile?.name || user?.email}
                    </span>
                    <span className="ml-2 px-2 py-1 bg-[#00ffba]/20 text-[#00ffba] text-xs rounded">
                      Coach
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-none text-xs lg:text-sm px-2 lg:px-4"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Αποσύνδεση</span>
                  </Button>
                </div>
              </div>
            </nav>
          )}

          {/* Subscriptions Content */}
          <div className="flex-1 p-2 lg:p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="rounded-none mb-4">
                <TabsTrigger value="subscriptions" className="rounded-none">
                  Συνδρομές
                </TabsTrigger>
                <TabsTrigger value="types" className="rounded-none">
                  Τύποι
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subscriptions">
                <Card className="rounded-none">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Συνδρομές ({filteredSubscriptions.length})
                      </CardTitle>
                      <Button 
                        onClick={() => setNewSubscriptionOpen(true)}
                        className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Νέα Συνδρομή
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Αναζήτηση με όνομα ή email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 rounded-none"
                        />
                      </div>
                    </div>

                    {loadingSubscriptions ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Φόρτωση συνδρομών...</p>
                      </div>
                    ) : filteredSubscriptions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Δεν βρέθηκαν συνδρομές</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Αθλητής</TableHead>
                                <TableHead>Τύπος Συνδρομής</TableHead>
                                <TableHead>Έναρξη</TableHead>
                                <TableHead>Λήξη</TableHead>
                                <TableHead>Κατάσταση</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSubscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={sub.coach_users?.avatar_url || ""}
                                        />
                                        <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba]">
                                          {sub.coach_users?.name?.charAt(0)?.toUpperCase() || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{sub.coach_users?.name || "Άγνωστος"}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {sub.coach_users?.email || "-"}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{sub.subscription_types?.name || "-"}</TableCell>
                                  <TableCell>{formatDate(sub.start_date)}</TableCell>
                                  <TableCell>{formatDate(sub.end_date)}</TableCell>
                                  <TableCell>
                                    <span
                                      className={`px-2 py-1 text-xs rounded ${getStatusColor(
                                        sub.status,
                                        sub.is_paused
                                      )}`}
                                    >
                                      {getStatusLabel(sub.status, sub.is_paused)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                          {filteredSubscriptions.map((sub) => (
                            <Card key={sub.id} className="rounded-none">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage
                                        src={sub.coach_users?.avatar_url || ""}
                                      />
                                      <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba]">
                                        {sub.coach_users?.name?.charAt(0)?.toUpperCase() || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{sub.coach_users?.name || "Άγνωστος"}</p>
                                      <p className="text-sm text-gray-500">
                                        {sub.subscription_types?.name || "-"}
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2 py-1 text-xs rounded ${getStatusColor(
                                      sub.status,
                                      sub.is_paused
                                    )}`}
                                  >
                                    {getStatusLabel(sub.status, sub.is_paused)}
                                  </span>
                                </div>
                                <div className="mt-3 text-sm text-gray-600">
                                  {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="types">
                {effectiveCoachId && (
                  <SubscriptionTypesTab coachId={effectiveCoachId} />
                )}
              </TabsContent>
            </Tabs>

            {/* New Subscription Dialog */}
            {effectiveCoachId && (
              <NewSubscriptionDialog
                open={newSubscriptionOpen}
                onOpenChange={setNewSubscriptionOpen}
                coachId={effectiveCoachId}
                onSuccess={fetchSubscriptions}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachSubscriptions;
