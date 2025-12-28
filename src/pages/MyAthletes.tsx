import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Edit, Trash2, Search, Menu, Eye, Mail, ArrowRightLeft } from "lucide-react";
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
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
import { NewCoachUserDialog } from "@/components/coach-users/NewCoachUserDialog";
import { EditCoachUserDialog } from "@/components/coach-users/EditCoachUserDialog";
import { DeleteCoachUserDialog } from "@/components/coach-users/DeleteCoachUserDialog";
import { ViewCoachUserDialog } from "@/components/coach-users/ViewCoachUserDialog";

interface CoachUser {
  id: string;
  coach_id: string;
  name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  avatar_url?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Computed from subscriptions
  subscriptionStatus?: 'active' | 'paused' | 'inactive';
}

const MyAthletes = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [searchParams] = useSearchParams();

  const coachIdParam = searchParams.get("coachId");
  const isAdminViewingCoach = !!coachIdParam && isAdmin() && coachIdParam !== userProfile?.id;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isMobile = useIsMobile();
  const [athletes, setAthletes] = useState<CoachUser[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Admin-only: athletes currently attached to admin (legacy/wrong) that can be reassigned
  const [adminAthletes, setAdminAthletes] = useState<CoachUser[]>([]);
  const [loadingAdminAthletes, setLoadingAdminAthletes] = useState(false);

  // Dialog states
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CoachUser | null>(null);

  const effectiveCoachId = useMemo(() => {
    // Επιτρέπουμε προβολή/διαχείριση αθλητών άλλου coach ΜΟΝΟ σε admin.
    if (coachIdParam && isAdmin() && coachIdParam !== userProfile?.id) return coachIdParam;

    return userProfile?.id ?? null;
  }, [coachIdParam, isAdmin, userProfile?.id]);

  // Check for tablet size
  useEffect(() => {
    const checkTabletSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkTabletSize();
    window.addEventListener("resize", checkTabletSize);

    return () => window.removeEventListener("resize", checkTabletSize);
  }, []);

  const fetchAthletes = async () => {
    if (loadingAthletes || !effectiveCoachId) return;

    setLoadingAthletes(true);
    try {
      // Fetch athletes
      const { data: athletesData, error: athletesError } = await supabase
        .from("coach_users")
        .select("*")
        .eq("coach_id", effectiveCoachId)
        .order("created_at", { ascending: false });

      if (athletesError) {
        console.error("❌ Error fetching athletes:", athletesError);
        toast.error("Σφάλμα κατά τη φόρτωση αθλητών");
        return;
      }

      // Fetch subscriptions for these athletes
      const athleteIds = (athletesData || []).map(a => a.id);
      
      let subscriptionsMap: Record<string, { status: string; is_paused: boolean; end_date: string }[]> = {};
      
      if (athleteIds.length > 0) {
        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from("coach_subscriptions")
          .select("coach_user_id, status, is_paused, end_date")
          .in("coach_user_id", athleteIds);

        if (!subscriptionsError && subscriptionsData) {
          // Group subscriptions by coach_user_id
          subscriptionsData.forEach(sub => {
            if (!subscriptionsMap[sub.coach_user_id]) {
              subscriptionsMap[sub.coach_user_id] = [];
            }
            subscriptionsMap[sub.coach_user_id].push(sub);
          });
        }
      }

      // Calculate subscription status for each athlete
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const athletesWithStatus = (athletesData || []).map(athlete => {
        const subs = subscriptionsMap[athlete.id] || [];
        
        // Check for active subscription (not expired)
        const activeSub = subs.find(sub => {
          const endDate = new Date(sub.end_date);
          endDate.setHours(23, 59, 59, 999);
          return endDate >= today && sub.status === 'active';
        });

        let subscriptionStatus: 'active' | 'paused' | 'inactive' = 'inactive';
        
        if (activeSub) {
          if (activeSub.is_paused) {
            subscriptionStatus = 'paused';
          } else {
            subscriptionStatus = 'active';
          }
        }

        return {
          ...athlete,
          subscriptionStatus
        };
      });

      setAthletes(athletesWithStatus);
    } catch (error) {
      console.error("💥 Error:", error);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const fetchAdminAthletes = async () => {
    if (!isAdminViewingCoach || loadingAdminAthletes || !userProfile?.id) {
      setAdminAthletes([]);
      return;
    }

    setLoadingAdminAthletes(true);
    try {
      const { data, error } = await supabase
        .from("coach_users")
        .select("*")
        .eq("coach_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching admin athletes:", error);
        return;
      }

      setAdminAthletes(data || []);
    } finally {
      setLoadingAdminAthletes(false);
    }
  };

  const reassignAthleteToCoach = async (athleteId: string) => {
    if (!effectiveCoachId) return;

    try {
      const { error } = await supabase
        .from("coach_users")
        .update({ coach_id: effectiveCoachId })
        .eq("id", athleteId);

      if (error) {
        console.error("❌ Error reassigning athlete:", error);
        toast.error("Αποτυχία μεταφοράς αθλητή");
        return;
      }

      toast.success("Ο αθλητής μεταφέρθηκε στον coach");
      fetchAthletes();
      fetchAdminAthletes();
    } catch (e) {
      console.error(e);
      toast.error("Αποτυχία μεταφοράς αθλητή");
    }
  };

  useEffect(() => {
    if (!rolesLoading && effectiveCoachId) {
      fetchAthletes();
    }
    if (!rolesLoading) {
      fetchAdminAthletes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, effectiveCoachId, isAdminViewingCoach, userProfile?.id]);

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Επιτρέπουμε πρόσβαση μόνο σε coaches (χωρίς redirect αν δεν υπάρχει coach role ακόμα)

  const handleViewUser = (user: CoachUser) => {
    setSelectedUser(user);
    setViewUserDialogOpen(true);
  };

  const handleEditUser = (user: CoachUser) => {
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: CoachUser) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  };

  const handleSendPasswordReset = async (user: CoachUser) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success(`Email επαναφοράς κωδικού στάλθηκε στο ${user.email}`);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error('Σφάλμα κατά την αποστολή email επαναφοράς');
    }
  };

  const handleUserCreated = () => {
    fetchAthletes();
    setNewUserDialogOpen(false);
  };

  const handleUserUpdated = () => {
    fetchAthletes();
    setEditUserDialogOpen(false);
  };

  const handleUserDeleted = () => {
    fetchAthletes();
    setDeleteUserDialogOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const getSubscriptionStatusColor = (status?: 'active' | 'paused' | 'inactive') => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionStatusText = (status?: 'active' | 'paused' | 'inactive') => {
    switch (status) {
      case 'active':
        return 'Ενεργός';
      case 'paused':
        return 'Σε παύση';
      case 'inactive':
        return 'Ανενεργός';
      default:
        return 'Ανενεργός';
    }
  };

  // Filter athletes based on search term
  const filteredAthletes = athletes.filter(athlete => {
    return matchesSearchTerm(athlete.name, searchTerm) ||
           matchesSearchTerm(athlete.email, searchTerm);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <CoachSidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
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
                  <h1 className="ml-4 text-lg font-semibold text-gray-900">
                    Οι Αθλητές μου
                  </h1>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-none"
                  onClick={handleSignOut}
                >
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
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                    Οι Αθλητές μου
                  </h1>
                  <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                    Διαχείριση των αθλητών σας
                  </p>
                </div>
                <div className="flex items-center space-x-2 lg:space-x-4">
                  <div className="hidden md:flex items-center text-xs lg:text-sm text-gray-600">
                    <span className="truncate max-w-32 lg:max-w-none">
                      {userProfile?.name || user?.email}
                    </span>
                    <span className="ml-2 px-2 py-1 bg-[#00ffba]/20 text-[#00ffba] text-xs rounded">Coach</span>
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

          {/* Athletes Content */}
          <div className="flex-1 p-2 lg:p-6 space-y-6">
            <Card className="rounded-none">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-lg">Αθλητές ({filteredAthletes.length})</CardTitle>
                  <Button 
                    onClick={() => setNewUserDialogOpen(true)}
                    className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Νέος Αθλητής
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

                {/* Admin mapping helper: show athletes that are currently attached to admin (legacy) */}
                {isAdminViewingCoach && (loadingAdminAthletes || adminAthletes.length > 0) && (
                  <div className="mb-4 border border-border rounded-none">
                    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">Αθλητές για αντιστοίχιση</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Αυτοί οι αθλητές έχουν αποθηκευτεί στον admin. Πάτα “Μεταφορά” για να μπουν στον coach.
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {loadingAdminAthletes ? "..." : `${adminAthletes.length}`}
                      </div>
                    </div>

                    <div className="divide-y divide-border">
                      {loadingAdminAthletes ? (
                        <div className="px-3 py-3 text-sm text-muted-foreground">Φόρτωση...</div>
                      ) : (
                        adminAthletes
                          .filter((a) =>
                            matchesSearchTerm(a.name, searchTerm) || matchesSearchTerm(a.email, searchTerm)
                          )
                          .slice(0, 30)
                          .map((a) => (
                            <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={a.avatar_url || ""} />
                                  <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba]">
                                    {a.name?.charAt(0)?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none"
                                onClick={() => reassignAthleteToCoach(a.id)}
                              >
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Μεταφορά
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {loadingAthletes ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Φόρτωση αθλητών...</p>
                  </div>
                ) : filteredAthletes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Δεν βρέθηκαν αθλητές</p>
                    <Button 
                      onClick={() => setNewUserDialogOpen(true)}
                      variant="outline"
                      className="mt-4 rounded-none"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Προσθήκη Πρώτου Αθλητή
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Αθλητής</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Τηλέφωνο</TableHead>
                            <TableHead>Κατάσταση</TableHead>
                            <TableHead>Ημ. Εγγραφής</TableHead>
                            <TableHead className="text-right">Ενέργειες</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAthletes.map((athlete) => (
                            <TableRow key={athlete.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={athlete.avatar_url || ''} />
                                    <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba]">
                                      {athlete.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{athlete.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{athlete.email}</TableCell>
                              <TableCell>{athlete.phone || '-'}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(athlete.subscriptionStatus)}`}>
                                  {getSubscriptionStatusText(athlete.subscriptionStatus)}
                                </span>
                              </TableCell>
                              <TableCell>{formatDate(athlete.created_at)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none"
                                    onClick={() => handleViewUser(athlete)}
                                    title="Προβολή"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none"
                                    onClick={() => handleEditUser(athlete)}
                                    title="Επεξεργασία"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none"
                                    onClick={() => handleSendPasswordReset(athlete)}
                                    title="Επαναφορά κωδικού"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteUser(athlete)}
                                    title="Διαγραφή"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredAthletes.map((athlete) => (
                        <Card key={athlete.id} className="rounded-none">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={athlete.avatar_url || ''} />
                                  <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba]">
                                    {athlete.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{athlete.name}</p>
                                  <p className="text-sm text-gray-500">{athlete.email}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${getSubscriptionStatusColor(athlete.subscriptionStatus)}`}>
                                {getSubscriptionStatusText(athlete.subscriptionStatus)}
                              </span>
                            </div>
                            <div className="mt-3 flex justify-end space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none"
                                onClick={() => handleViewUser(athlete)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none"
                                onClick={() => handleEditUser(athlete)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none"
                                onClick={() => handleSendPasswordReset(athlete)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none text-red-600"
                                onClick={() => handleDeleteUser(athlete)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NewCoachUserDialog
        open={newUserDialogOpen}
        onOpenChange={setNewUserDialogOpen}
        onSuccess={handleUserCreated}
        coachId={effectiveCoachId || ""}
      />

      {selectedUser && (
        <>
          <ViewCoachUserDialog
            open={viewUserDialogOpen}
            onOpenChange={setViewUserDialogOpen}
            user={selectedUser}
          />
          <EditCoachUserDialog
            open={editUserDialogOpen}
            onOpenChange={setEditUserDialogOpen}
            user={selectedUser}
            onSuccess={handleUserUpdated}
          />
          <DeleteCoachUserDialog
            open={deleteUserDialogOpen}
            onOpenChange={setDeleteUserDialogOpen}
            user={selectedUser}
            onSuccess={handleUserDeleted}
          />
        </>
      )}
    </div>
  );
};

export default MyAthletes;
