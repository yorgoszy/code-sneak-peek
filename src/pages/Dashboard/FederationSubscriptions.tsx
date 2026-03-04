import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Search, Plus, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { matchesSearchTerm } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { SubscriptionTypesTab } from "@/components/coach/subscriptions/SubscriptionTypesTab";
import { NewSubscriptionDialog } from "@/components/coach/subscriptions/NewSubscriptionDialog";
import { CoachSubscriptionEditDialog } from "@/components/coach/subscriptions/CoachSubscriptionEditDialog";
import { CoachSubscriptionDeleteDialog } from "@/components/coach/subscriptions/CoachSubscriptionDeleteDialog";
import { CoachSubscriptionActions } from "@/components/coach/subscriptions/CoachSubscriptionActions";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface FederationSubscription {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  is_paused: boolean;
  is_paid?: boolean;
  notes: string | null;
  created_at: string;
  subscription_types?: { id: string; name: string; price: number; duration_months: number } | null;
  app_users?: { name: string; email: string; avatar_url: string | null; photo_url: string | null } | null;
}

const FederationSubscriptions = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  const [subscriptions, setSubscriptions] = useState<FederationSubscription[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<{ id: string; name: string; price: number; duration_months: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [newSubscriptionOpen, setNewSubscriptionOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<FederationSubscription | null>(null);

  const federationId = userProfile?.id;

  useEffect(() => {
    if (federationId) { fetchSubscriptions(); fetchSubscriptionTypes(); }
  }, [federationId]);

  const fetchSubscriptionTypes = async () => {
    if (!federationId) return;
    const { data } = await supabase.from("subscription_types").select("id, name, price, duration_months").eq("coach_id", federationId);
    setSubscriptionTypes(data || []);
  };

  const fetchSubscriptions = async () => {
    if (!federationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coach_subscriptions")
        .select(`
          *,
          subscription_types (id, name, price, duration_months),
          app_users!coach_subscriptions_user_id_fkey (name, email, avatar_url, photo_url)
        `)
        .eq("coach_id", federationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("coach_subscriptions").update({ is_paid: !currentStatus }).eq("id", id);
      if (error) throw error;
      toast.success(currentStatus ? (language === 'el' ? "Σημειώθηκε ως μη πληρωμένη" : "Marked as unpaid") : (language === 'el' ? "Σημειώθηκε ως πληρωμένη" : "Marked as paid"));
      fetchSubscriptions();
    } catch (error: any) { toast.error(error.message); }
  };

  const pauseSubscription = async (id: string) => {
    try {
      const sub = subscriptions.find(s => s.id === id);
      if (!sub) return;
      const remainingDays = Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / 86400000));
      const { error } = await supabase.from("coach_subscriptions").update({ is_paused: true, paused_at: new Date().toISOString(), paused_days_remaining: remainingDays }).eq("id", id);
      if (error) throw error;
      toast.success(language === 'el' ? "Σε παύση" : "Paused");
      fetchSubscriptions();
    } catch (error: any) { toast.error(error.message); }
  };

  const resumeSubscription = async (id: string) => {
    try {
      const sub = subscriptions.find(s => s.id === id);
      if (!sub) return;
      const remaining = (sub as any).paused_days_remaining || 0;
      const newEnd = new Date(); newEnd.setDate(newEnd.getDate() + remaining);
      const { error } = await supabase.from("coach_subscriptions").update({ is_paused: false, paused_at: null, paused_days_remaining: null, end_date: newEnd.toISOString().split("T")[0] }).eq("id", id);
      if (error) throw error;
      toast.success(language === 'el' ? "Συνεχίζεται" : "Resumed");
      fetchSubscriptions();
    } catch (error: any) { toast.error(error.message); }
  };

  const renewSubscription = async (id: string) => {
    try {
      const sub = subscriptions.find(s => s.id === id);
      if (!sub?.subscription_types) return;
      const months = sub.subscription_types.duration_months || 1;
      const start = new Date(sub.end_date) > new Date() ? new Date(sub.end_date) : new Date();
      const end = new Date(start); end.setMonth(end.getMonth() + months); end.setDate(end.getDate() - 1);
      const { error } = await supabase.from("coach_subscriptions").insert({
        coach_id: federationId, user_id: sub.user_id, subscription_type_id: sub.subscription_types.id,
        start_date: start.toISOString().split("T")[0], end_date: end.toISOString().split("T")[0], status: "active", is_paused: false
      });
      if (error) throw error;
      toast.success(language === 'el' ? "Ανανεώθηκε" : "Renewed");
      fetchSubscriptions();
    } catch (error: any) { toast.error(error.message); }
  };

  const deleteSubscription = async () => {
    if (!subscriptionToDelete) return;
    try {
      const { error } = await supabase.from("coach_subscriptions").delete().eq("id", subscriptionToDelete);
      if (error) throw error;
      toast.success(language === 'el' ? "Διαγράφηκε" : "Deleted");
      fetchSubscriptions();
    } catch (error: any) { toast.error(error.message); }
    finally { setSubscriptionToDelete(null); }
  };

  const getDaysUntilExpiry = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);

  const getDaysExpiryText = (endDate: string, isPaused: boolean) => {
    const days = getDaysUntilExpiry(endDate);
    if (isPaused) return language === 'el' ? "Σε παύση" : "Paused";
    if (days < 0) return `${Math.abs(days)} ${language === 'el' ? 'ημ. πριν' : 'days ago'}`;
    if (days === 0) return language === 'el' ? "Σήμερα" : "Today";
    return `${days} ${language === 'el' ? 'ημέρες' : 'days'}`;
  };

  const getDaysExpiryColor = (endDate: string, isPaused: boolean) => {
    if (isPaused) return "text-yellow-600";
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return "text-red-600 font-medium";
    if (days <= 7) return "text-orange-600 font-medium";
    if (days <= 14) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusBadge = (status: string, isPaused: boolean) => {
    if (isPaused) return <Badge className="bg-yellow-100 text-yellow-800 rounded-none">{language === 'el' ? 'Παύση' : 'Paused'}</Badge>;
    if (status === 'active') return <Badge className="bg-green-100 text-green-800 rounded-none">{language === 'el' ? 'Ενεργή' : 'Active'}</Badge>;
    if (status === 'expired') return <Badge className="bg-red-100 text-red-800 rounded-none">{language === 'el' ? 'Ληγμένη' : 'Expired'}</Badge>;
    return <Badge className="bg-muted text-muted-foreground rounded-none">{status}</Badge>;
  };

  const filtered = subscriptions
    .filter(s => {
      const name = s.app_users?.name || "";
      const email = s.app_users?.email || "";
      return matchesSearchTerm(name, searchTerm) || matchesSearchTerm(email, searchTerm);
    })
    .sort((a, b) => {
      const aDays = getDaysUntilExpiry(a.end_date);
      const bDays = getDaysUntilExpiry(b.end_date);
      if (aDays < 0 && bDays >= 0) return -1;
      if (aDays >= 0 && bDays < 0) return 1;
      return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
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
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">{t("federation.subscriptions.title")}</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground">{t("federation.subscriptions.title")}</h1>
              <p className="text-muted-foreground text-sm">{t("federation.subscriptions.subtitle")}</p>
            </div>

            {!federationId ? (
              <div className="text-center py-8 text-muted-foreground">{t("federation.common.loading")}</div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none">
                  <TabsTrigger value="subscriptions" className="rounded-none">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {language === 'el' ? 'Συνδρομές' : 'Subscriptions'}
                  </TabsTrigger>
                  <TabsTrigger value="types" className="rounded-none">
                    {language === 'el' ? 'Τύποι Συνδρομών' : 'Subscription Types'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" className="mt-4">
                  <Card className="rounded-none">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <CardTitle className="text-lg">{language === 'el' ? 'Ενεργές Συνδρομές' : 'Active Subscriptions'}</CardTitle>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={language === 'el' ? 'Αναζήτηση...' : 'Search...'} className="pl-10 rounded-none" />
                          </div>
                          <Button onClick={() => setNewSubscriptionOpen(true)} className="rounded-none bg-foreground hover:bg-foreground/90 text-background" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            {language === 'el' ? 'Νέα' : 'New'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8 text-muted-foreground">{t("federation.common.loading")}</div>
                      ) : filtered.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {language === 'el' ? 'Δεν βρέθηκαν συνδρομές' : 'No subscriptions found'}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{language === 'el' ? 'Χρήστης' : 'User'}</TableHead>
                                <TableHead>{language === 'el' ? 'Τύπος' : 'Type'}</TableHead>
                                <TableHead>{language === 'el' ? 'Κατάσταση' : 'Status'}</TableHead>
                                <TableHead>{language === 'el' ? 'Λήξη' : 'Expiry'}</TableHead>
                                <TableHead>{language === 'el' ? 'Ενέργειες' : 'Actions'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map(sub => (
                                <TableRow key={sub.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={sub.app_users?.photo_url || sub.app_users?.avatar_url || ""} />
                                        <AvatarFallback className="text-xs">{sub.app_users?.name?.charAt(0) || "?"}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">{sub.app_users?.name}</p>
                                        <p className="text-xs text-muted-foreground">{sub.app_users?.email}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm">{sub.subscription_types?.name}</p>
                                    <p className="text-xs text-muted-foreground">{sub.subscription_types?.price}€</p>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(sub.status, sub.is_paused)}</TableCell>
                                  <TableCell>
                                    <p className={`text-sm ${getDaysExpiryColor(sub.end_date, sub.is_paused)}`}>
                                      {getDaysExpiryText(sub.end_date, sub.is_paused)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(sub.end_date), "dd/MM/yyyy")}</p>
                                  </TableCell>
                                  <TableCell>
                                    <CoachSubscriptionActions
                                      subscriptionId={sub.id}
                                      isPaused={sub.is_paused}
                                      isPaid={sub.is_paid || false}
                                      onPause={pauseSubscription}
                                      onResume={resumeSubscription}
                                      onRenew={renewSubscription}
                                      onTogglePayment={togglePaymentStatus}
                                      onEdit={(id) => { setSubscriptionToEdit(sub); setEditDialogOpen(true); }}
                                      onDelete={(id) => { setSubscriptionToDelete(sub.id); setDeleteDialogOpen(true); }}
                                    />
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="types" className="mt-4">
                  <SubscriptionTypesTab coachId={federationId} />
                </TabsContent>
              </Tabs>
            )}
          </main>
        </div>
      </div>

      <NewSubscriptionDialog
        open={newSubscriptionOpen}
        onOpenChange={setNewSubscriptionOpen}
        coachId={federationId || ""}
        onSuccess={fetchSubscriptions}
      />

      <CoachSubscriptionEditDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        subscription={subscriptionToEdit as any}
        subscriptionTypes={subscriptionTypes}
        onSuccess={fetchSubscriptions}
      />

      <CoachSubscriptionDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDelete={deleteSubscription}
      />
    </SidebarProvider>
  );
};

export default FederationSubscriptions;
