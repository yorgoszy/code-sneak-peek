import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Search, CreditCard, Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { SubscriptionTypesTab } from "@/components/coach/subscriptions/SubscriptionTypesTab";
import { NewSubscriptionDialog } from "@/components/coach/subscriptions/NewSubscriptionDialog";
import { CoachSubscriptionActions } from "@/components/coach/subscriptions/CoachSubscriptionActions";
import { CoachSubscriptionDeleteDialog } from "@/components/coach/subscriptions/CoachSubscriptionDeleteDialog";
import { CoachSubscriptionEditDialog } from "@/components/coach/subscriptions/CoachSubscriptionEditDialog";
import { CoachFinancialOverview } from "@/components/coach/CoachFinancialOverview";
import { CoachExpenseManagement } from "@/components/coach/CoachExpenseManagement";
import { CoachReceiptsManagement } from "@/components/coach/CoachReceiptsManagement";
import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface SubscriptionType {
  id: string;
  name: string;
  price: number;
  duration_months: number;
}

interface CoachSubscription {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  is_paused: boolean;
  is_paid?: boolean;
  notes: string | null;
  created_at: string;
  subscription_types?: {
    id: string;
    name: string;
    price: number;
    duration_months: number;
  } | null;
  app_users?: {
    name: string;
    email: string;
    avatar_url: string | null;
    photo_url: string | null;
  } | null;
}

const CoachSubscriptionsContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { coachId } = useCoachContext();
  const isMobile = useIsMobile();
  
  const [subscriptions, setSubscriptions] = useState<CoachSubscription[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [newSubscriptionOpen, setNewSubscriptionOpen] = useState(false);
  // Οι admin χρησιμοποιούν τον κεντρικό πίνακα user_subscriptions, οι coaches τον coach_subscriptions
  const [subsTable, setSubsTable] = useState<"coach_subscriptions" | "user_subscriptions" | null>(null);

  useEffect(() => {
    if (!coachId || searchParams.get("action") !== "create") return;
    setActiveTab("subscriptions");
    setNewSubscriptionOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("action");
    setSearchParams(nextParams, { replace: true });
  }, [coachId, searchParams, setSearchParams]);
  
  // Action dialogs state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<CoachSubscription | null>(null);
  const [financialRefreshKey, setFinancialRefreshKey] = useState(0);

  const triggerFinancialRefresh = () => setFinancialRefreshKey(prev => prev + 1);

  const fetchSubscriptions = async (table: "coach_subscriptions" | "user_subscriptions" | null = subsTable) => {
    if (loadingSubscriptions || !coachId || !table) return;

    setLoadingSubscriptions(true);
    try {
      const userJoin = table === "user_subscriptions"
        ? "app_users!user_subscriptions_user_id_fkey (name, email, avatar_url, photo_url)"
        : "app_users!coach_subscriptions_user_id_fkey (name, email, avatar_url, photo_url)";
      const { data, error } = await supabase
        .from(table)
        .select(`
          *,
          subscription_types (id, name, price, duration_months),
          ${userJoin}
        `)
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching subscriptions:", error);
        toast.error("Σφάλμα κατά τη φόρτωση συνδρομών");
        return;
      }

      setSubscriptions((data as any) || []);
    } catch (error) {
      console.error("💥 Error:", error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const fetchSubscriptionTypes = async () => {
    if (!coachId) return;
    
    try {
      const { data, error } = await supabase
        .from("subscription_types")
        .select("id, name, price, duration_months")
        .eq("coach_id", coachId);

      if (error) throw error;
      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error("Error fetching subscription types:", error);
    }
  };

  // Action handlers
  const togglePaymentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from(subsTable!)
        .update({ is_paid: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Η συνδρομή σημειώθηκε ως μη πληρωμένη" : "Η συνδρομή σημειώθηκε ως πληρωμένη");
      fetchSubscriptions();
    } catch (error: any) {
      toast.error("Σφάλμα: " + error.message);
    }
  };

  const pauseSubscription = async (id: string) => {
    try {
      const subscription = subscriptions.find(s => s.id === id);
      if (!subscription) return;

      const endDate = new Date(subscription.end_date);
      const today = new Date();
      const remainingDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      const { error } = await supabase
        .from(subsTable!)
        .update({
          is_paused: true,
          paused_at: new Date().toISOString(),
          paused_days_remaining: Math.max(0, remainingDays)
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Η συνδρομή τέθηκε σε παύση");
      fetchSubscriptions();
    } catch (error: any) {
      toast.error("Σφάλμα: " + error.message);
    }
  };

  const resumeSubscription = async (id: string) => {
    try {
      const subscription = subscriptions.find(s => s.id === id);
      if (!subscription) return;

      const today = new Date();
      const remainingDays = (subscription as any).paused_days_remaining || 0;
      const newEndDate = new Date(today);
      newEndDate.setDate(today.getDate() + remainingDays);

      const { error } = await supabase
        .from(subsTable!)
        .update({
          is_paused: false,
          paused_at: null,
          paused_days_remaining: null,
          end_date: newEndDate.toISOString().split("T")[0]
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Η συνδρομή συνεχίζεται");
      fetchSubscriptions();
    } catch (error: any) {
      toast.error("Σφάλμα: " + error.message);
    }
  };

  const generateReceiptNumber = async () => {
    const { data, error } = await supabase
      .from('coach_receipts')
      .select('receipt_number')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error generating receipt number:', error);
      return 'ΑΠ-0001';
    }

    if (!data || data.length === 0) {
      return 'ΑΠ-0001';
    }

    const lastNumber = data[0].receipt_number;
    const numberPart = parseInt(lastNumber.split('-')[1]) || 0;
    return `ΑΠ-${String(numberPart + 1).padStart(4, '0')}`;
  };

  const renewSubscription = async (id: string) => {
    try {
      const subscription = subscriptions.find(s => s.id === id);
      if (!subscription || !subscription.subscription_types) return;

      const durationMonths = subscription.subscription_types.duration_months || 1;
      const currentEndDate = new Date(subscription.end_date);
      const today = new Date();
      
      const newStartDate = currentEndDate > today ? currentEndDate : today;
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);
      newEndDate.setDate(newEndDate.getDate() - 1);

      const insertPayload: any = {
        coach_id: coachId,
        user_id: subscription.user_id,
        subscription_type_id: subscription.subscription_types.id,
        start_date: newStartDate.toISOString().split("T")[0],
        end_date: newEndDate.toISOString().split("T")[0],
        status: "active",
        is_paused: false
      };
      if (subsTable === "coach_subscriptions") {
        insertPayload.coach_user_id = subscription.user_id;
      }

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from(subsTable!)
        .insert(insertPayload)
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      const receiptNumber = await generateReceiptNumber();
      const { error: receiptError } = await supabase
        .from('coach_receipts')
        .insert({
          coach_id: coachId,
          user_id: subscription.user_id,
          coach_user_id: subscription.user_id,
          subscription_id: subscriptionData.id,
          receipt_number: receiptNumber,
          amount: subscription.subscription_types.price,
          receipt_type: 'renewal',
          subscription_type_id: subscription.subscription_types.id,
          notes: `Ανανέωση συνδρομής: ${subscription.subscription_types.name}`
        });

      if (receiptError) {
        console.error('Error creating receipt:', receiptError);
      }

      toast.success("Η συνδρομή ανανεώθηκε επιτυχώς");
      fetchSubscriptions();
    } catch (error: any) {
      toast.error("Σφάλμα: " + error.message);
    }
  };

  const openEditDialog = (id: string) => {
    const subscription = subscriptions.find(s => s.id === id);
    if (subscription) {
      setSubscriptionToEdit(subscription);
      setEditDialogOpen(true);
    }
  };

  const openDeleteDialog = (id: string) => {
    setSubscriptionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const deleteSubscription = async () => {
    if (!subscriptionToDelete) return;

    try {
      const { error } = await supabase
        .from(subsTable!)
        .delete()
        .eq("id", subscriptionToDelete);

      if (error) throw error;
      toast.success("Η συνδρομή διαγράφηκε επιτυχώς");
      fetchSubscriptions();
    } catch (error: any) {
      toast.error("Σφάλμα: " + error.message);
    } finally {
      setSubscriptionToDelete(null);
    }
  };

  // Εντοπισμός ρόλου: αν ο χρήστης είναι admin, οι συνδρομές είναι στον user_subscriptions
  useEffect(() => {
    const detectTable = async () => {
      if (!coachId) return;
      const { data } = await supabase
        .from("app_users")
        .select("role")
        .eq("id", coachId)
        .single();
      const table = data?.role === "admin" ? "user_subscriptions" : "coach_subscriptions";
      setSubsTable(table);
      fetchSubscriptions(table);
      fetchSubscriptionTypes();
    };
    detectTable();
  }, [coachId]);

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

  const filteredSubscriptions = subscriptions
    .filter((sub) => {
      const userName = sub.app_users?.name || "";
      const userEmail = sub.app_users?.email || "";
      return matchesSearchTerm(userName, searchTerm) || matchesSearchTerm(userEmail, searchTerm);
    })
    .sort((a, b) => {
      const today = new Date();
      const aEnd = new Date(a.end_date);
      const bEnd = new Date(b.end_date);
      const aDays = Math.ceil((aEnd.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const bDays = Math.ceil((bEnd.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      const aExpired = aDays < 0;
      const bExpired = bDays < 0;
      
      if (aExpired && !bExpired) return -1;
      if (!aExpired && bExpired) return 1;
      
      return aEnd.getTime() - bEnd.getTime();
    });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: el });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  const getDaysExpiryText = (endDate: string, isPaused: boolean) => {
    const days = getDaysUntilExpiry(endDate);
    if (isPaused) return "Σε παύση";
    if (days < 0) return `${Math.abs(days)} ημ. πριν`;
    if (days === 0) return "Σήμερα";
    if (days === 1) return "1 ημέρα";
    return `${days} ημέρες`;
  };

  const getDaysExpiryColor = (endDate: string, isPaused: boolean) => {
    if (isPaused) return "text-yellow-600";
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return "text-red-600 font-medium";
    if (days <= 7) return "text-orange-600 font-medium";
    if (days <= 14) return "text-yellow-600";
    return "text-green-600";
  };

  if (!coachId) return null;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 rounded-none">
          <TabsTrigger value="subscriptions" className="rounded-none text-xs sm:text-sm">
            Συνδρομές
          </TabsTrigger>
          <TabsTrigger value="receipts" className="rounded-none text-xs sm:text-sm">
            Αποδείξεις
          </TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-none text-xs sm:text-sm">
            Έξοδα
          </TabsTrigger>
          <TabsTrigger value="overview" className="rounded-none text-xs sm:text-sm">
            Επισκόπηση
          </TabsTrigger>
          <TabsTrigger value="types" className="rounded-none text-xs sm:text-sm">
            Τύποι
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-4">
          <Card className="rounded-none">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#004aad]" />
                  Συνδρομές ({filteredSubscriptions.length})
                </CardTitle>
                <Button
                  onClick={() => setNewSubscriptionOpen(true)}
                  className="bg-[#004aad] hover:bg-[#004aad]/90 text-white rounded-none w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Νέα Συνδρομή
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                          <TableHead>Τύπος</TableHead>
                          <TableHead>Έναρξη</TableHead>
                          <TableHead>Λήξη</TableHead>
                          <TableHead>Υπόλοιπο</TableHead>
                          <TableHead>Κατάσταση</TableHead>
                          <TableHead>Πληρωμή</TableHead>
                          <TableHead className="text-right">Ενέργειες</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscriptions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8 rounded-full">
                                  <AvatarImage src={sub.app_users?.photo_url || sub.app_users?.avatar_url || ''} />
                                  <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] rounded-full">
                                    {sub.app_users?.name?.charAt(0).toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{sub.app_users?.name || 'Άγνωστο'}</p>
                                  <p className="text-xs text-gray-500">{sub.app_users?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{sub.subscription_types?.name || '-'}</TableCell>
                            <TableCell>{formatDate(sub.start_date)}</TableCell>
                            <TableCell>{formatDate(sub.end_date)}</TableCell>
                            <TableCell>
                              <span className={getDaysExpiryColor(sub.end_date, sub.is_paused)}>
                                {getDaysExpiryText(sub.end_date, sub.is_paused)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(sub.status, sub.is_paused)} rounded-none`}>
                                {getStatusLabel(sub.status, sub.is_paused)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${sub.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-none`}>
                                {sub.is_paid ? 'Πληρώθηκε' : 'Απλήρωτη'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <CoachSubscriptionActions
                                subscriptionId={sub.id}
                                isPaused={sub.is_paused}
                                isPaid={sub.is_paid || false}
                                onTogglePayment={() => togglePaymentStatus(sub.id, sub.is_paid || false)}
                                onPause={() => pauseSubscription(sub.id)}
                                onResume={() => resumeSubscription(sub.id)}
                                onRenew={() => renewSubscription(sub.id)}
                                onEdit={() => openEditDialog(sub.id)}
                                onDelete={() => openDeleteDialog(sub.id)}
                              />
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
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 rounded-full">
                                <AvatarImage src={sub.app_users?.photo_url || sub.app_users?.avatar_url || ''} />
                                <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] rounded-full">
                                  {sub.app_users?.name?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{sub.app_users?.name || 'Άγνωστο'}</p>
                                <p className="text-xs text-gray-500">{sub.subscription_types?.name}</p>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(sub.status, sub.is_paused)} rounded-none`}>
                              {getStatusLabel(sub.status, sub.is_paused)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">Λήξη:</span>
                              <span className={`ml-1 ${getDaysExpiryColor(sub.end_date, sub.is_paused)}`}>
                                {getDaysExpiryText(sub.end_date, sub.is_paused)}
                              </span>
                            </div>
                            <div>
                              <Badge className={`${sub.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-none`}>
                                {sub.is_paid ? 'Πληρώθηκε' : 'Απλήρωτη'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <CoachSubscriptionActions
                              subscriptionId={sub.id}
                              isPaused={sub.is_paused}
                              isPaid={sub.is_paid || false}
                              onTogglePayment={() => togglePaymentStatus(sub.id, sub.is_paid || false)}
                              onPause={() => pauseSubscription(sub.id)}
                              onResume={() => resumeSubscription(sub.id)}
                              onRenew={() => renewSubscription(sub.id)}
                              onEdit={() => openEditDialog(sub.id)}
                              onDelete={() => openDeleteDialog(sub.id)}
                            />
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

        <TabsContent value="types" className="mt-4">
          <SubscriptionTypesTab coachId={coachId} />
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <CoachFinancialOverview coachId={coachId} refreshKey={financialRefreshKey} />
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <CoachReceiptsManagement coachId={coachId} onDataChange={triggerFinancialRefresh} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <CoachExpenseManagement coachId={coachId} onDataChange={triggerFinancialRefresh} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewSubscriptionDialog
        open={newSubscriptionOpen}
        onOpenChange={setNewSubscriptionOpen}
        coachId={coachId}
        tableName={subsTable ?? "coach_subscriptions"}
        onSuccess={() => {
          fetchSubscriptions();
          setNewSubscriptionOpen(false);
        }}
      />

      <CoachSubscriptionDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDelete={deleteSubscription}
      />

      {subscriptionToEdit && (
        <CoachSubscriptionEditDialog
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          subscription={subscriptionToEdit}
          subscriptionTypes={subscriptionTypes}
          tableName={subsTable ?? "coach_subscriptions"}
          onSuccess={() => {
            fetchSubscriptions();
            setEditDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

const CoachSubscriptions = () => {
  return (
    <CoachLayout title="Συνδρομές" ContentComponent={CoachSubscriptionsContent} />
  );
};

export default CoachSubscriptions;
