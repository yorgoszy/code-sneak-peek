import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Search, Eye, Mail } from "lucide-react";
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
import { toast } from "sonner";
import { NewCoachUserDialog } from "@/components/coach-users/NewCoachUserDialog";
import { EditCoachUserDialog } from "@/components/coach-users/EditCoachUserDialog";
import { DeleteCoachUserDialog } from "@/components/coach-users/DeleteCoachUserDialog";
import { ViewCoachUserDialog } from "@/components/coach-users/ViewCoachUserDialog";
import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoachUser {
  id: string;
  coach_id: string;
  name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  avatar_url?: string;
  photo_url?: string;
  notes?: string;
  user_status: string;
  created_at: string;
  updated_at: string;
  subscriptionStatus?: 'active' | 'paused' | 'inactive' | 'unpaid';
}

const MyAthletesContent = () => {
  const { coachId } = useCoachContext();
  const isMobile = useIsMobile();
  
  const [athletes, setAthletes] = useState<CoachUser[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CoachUser | null>(null);

  const fetchAthletes = async () => {
    if (loadingAthletes || !coachId) return;

    setLoadingAthletes(true);
    try {
      const { data: athletesData, error: athletesError } = await supabase
        .from("app_users")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });

      if (athletesError) {
        console.error("❌ Error fetching athletes:", athletesError);
        toast.error("Σφάλμα κατά τη φόρτωση αθλητών");
        return;
      }

      const athleteIds = (athletesData || []).map(a => a.id);
      
      let subscriptionsMap: Record<string, { status: string; is_paused: boolean; end_date: string; is_paid: boolean | null }[]> = {};
      
      if (athleteIds.length > 0) {
        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from("coach_subscriptions")
          .select("user_id, coach_user_id, status, is_paused, end_date, is_paid")
          .or(`user_id.in.(${athleteIds.join(',')}),coach_user_id.in.(${athleteIds.join(',')})`);

        if (!subscriptionsError && subscriptionsData) {
          subscriptionsData.forEach(sub => {
            const subUserId = sub.user_id || sub.coach_user_id;
            if (subUserId && !subscriptionsMap[subUserId]) {
              subscriptionsMap[subUserId] = [];
            }
            if (subUserId) {
              subscriptionsMap[subUserId].push(sub);
            }
          });
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const athletesWithStatus = (athletesData || []).map(athlete => {
        const subs = subscriptionsMap[athlete.id] || [];
        
        const activeSub = subs.find(sub => {
          const endDate = new Date(sub.end_date);
          endDate.setHours(23, 59, 59, 999);
          return endDate >= today && sub.status === 'active';
        });

        let subscriptionStatus: 'active' | 'paused' | 'inactive' | 'unpaid' = 'inactive';
        
        if (activeSub) {
          if (activeSub.is_paid === false) {
            subscriptionStatus = 'unpaid';
          } else if (activeSub.is_paused) {
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

  useEffect(() => {
    if (coachId) {
      fetchAthletes();
    }
  }, [coachId]);

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
      const redirectUrl = 'https://www.hyperkids.gr/auth/reset-password';
      
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: user.email,
          redirectTo: redirectUrl,
        },
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const getSubscriptionStatusColor = (status?: 'active' | 'paused' | 'inactive' | 'unpaid') => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionStatusText = (status?: 'active' | 'paused' | 'inactive' | 'unpaid') => {
    switch (status) {
      case 'active':
        return 'Ενεργός';
      case 'paused':
        return 'Σε παύση';
      case 'unpaid':
        return 'Απλήρωτη';
      case 'inactive':
        return 'Ανενεργός';
      default:
        return 'Ανενεργός';
    }
  };

  const filteredAthletes = athletes.filter(athlete => {
    return matchesSearchTerm(athlete.name, searchTerm) ||
           matchesSearchTerm(athlete.email, searchTerm);
  });

  if (!coachId) return null;

  return (
    <div className="space-y-6">
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
                            <Avatar className="h-8 w-8 rounded-full">
                              <AvatarImage src={(athlete as any).photo_url || athlete.avatar_url || ''} />
                              <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] rounded-full">
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
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(athlete)}
                              className="rounded-none"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(athlete)}
                              className="rounded-none"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendPasswordReset(athlete)}
                              className="rounded-none"
                              title="Αποστολή email επαναφοράς κωδικού"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(athlete)}
                              className="rounded-none text-red-600 hover:text-red-700"
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
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 rounded-full">
                            <AvatarImage src={(athlete as any).photo_url || athlete.avatar_url || ''} />
                            <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] rounded-full">
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
                      <div className="mt-3 flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(athlete)}
                          className="rounded-none"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(athlete)}
                          className="rounded-none"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(athlete)}
                          className="rounded-none text-red-600"
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

      {/* Dialogs */}
      <NewCoachUserDialog
        open={newUserDialogOpen}
        onOpenChange={setNewUserDialogOpen}
        coachId={coachId}
        onSuccess={handleUserCreated}
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

const MyAthletes = () => {
  return (
    <CoachLayout title="Οι Αθλητές μου" ContentComponent={MyAthletesContent} />
  );
};

export default MyAthletes;
