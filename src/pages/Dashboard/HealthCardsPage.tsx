import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useSafeCoachContext } from "@/contexts/CoachContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, HeartPulse, Trash2, Eye, Pencil, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { matchesSearchTerm } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { HealthCardFormDialog } from "@/components/health-cards/HealthCardFormDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HealthCard {
  id: string;
  user_id: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    photo_url: string | null;
  };
}


/**
 * Το περιεχόμενο της Κάρτας Υγείας χωρίς layout.
 * Χρησιμοποιείται από την admin σελίδα (HealthCardsPage) και από τη
 * coach σελίδα (CoachHealthCardsPage) που το τυλίγει σε CoachLayout.
 * Ο καθένας βλέπει ΜΟΝΟ τους δικούς του χρήστες (φιλτράρισμα με userProfile.id).
 */
export function HealthCardsContent() {
  const { t } = useTranslation();
  const { userProfile } = useRoleCheck();
  const coachContext = useSafeCoachContext();

  const [healthCards, setHealthCards] = useState<HealthCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add/Edit dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<HealthCard | null>(null);

  // View dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingCard, setViewingCard] = useState<HealthCard | null>(null);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);

  // Helper to get a signed URL for a health card image
  const getSignedUrl = async (imageUrl: string): Promise<string | null> => {
    if (!imageUrl) return null;
    // If it's already a full URL (old public URL), extract path
    const storagePath = imageUrl.includes('/health-cards/')
      ? imageUrl.split('/health-cards/')[1]
      : imageUrl.startsWith('http')
        ? null // Can't resolve old full URLs that don't contain bucket path
        : imageUrl; // It's already a storage path

    if (!storagePath) return imageUrl; // Fallback to old URL

    const { data, error } = await supabase.storage
      .from('health-cards')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };

  // Resolve signed URL when viewing a card
  useEffect(() => {
    if (viewingCard?.image_url && isViewDialogOpen) {
      getSignedUrl(viewingCard.image_url).then(setSignedImageUrl);
    } else {
      setSignedImageUrl(null);
    }
  }, [viewingCard, isViewDialogOpen]);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<HealthCard | null>(null);

  // Κανόνας: ο καθένας βλέπει ΜΟΝΟ τους αθλητές του coach που είναι ανοιχτός.
  // Μέσα σε CoachLayout (coach σελίδα) παίρνουμε το coachId από το CoachContext
  // (τιμά και το ?coachId= του URL όταν admin βλέπει coach)· αλλιώς (admin σελίδα)
  // χρησιμοποιούμε το δικό μας app_users.id.
  const effectiveCoachId = coachContext?.coachId ?? userProfile?.id ?? null;


  useEffect(() => {
    loadHealthCards();
  }, [effectiveCoachId]);

  const loadHealthCards = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("health_cards")
        .select(`
          *,
          user:app_users!health_cards_user_id_fkey (
            id,
            name,
            email,
            photo_url
          )
        `)
        .order("end_date", { ascending: true });

      // If coach, only show their athletes
      if (effectiveCoachId) {
        const { data: athletes } = await supabase
          .from("app_users")
          .select("id")
          .eq("coach_id", effectiveCoachId);

        const athleteIds = athletes?.map((a) => a.id) || [];
        if (athleteIds.length > 0) {
          query = query.in("user_id", athleteIds);
        } else {
          setHealthCards([]);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setHealthCards(data || []);
    } catch (error) {
      console.error("Error loading health cards:", error);
      toast.error(t("healthCard.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (card: HealthCard) => {
    setEditingCard(card);
    setIsAddDialogOpen(true);
  };

  const handleDeleteHealthCard = async () => {
    if (!deletingCard) return;

    try {
      // Delete image from storage
      if (deletingCard.image_url) {
        const path = deletingCard.image_url.includes('/health-cards/')
          ? deletingCard.image_url.split('/health-cards/')[1]
          : deletingCard.image_url;
        if (path) {
          await supabase.storage.from("health-cards").remove([path]);
        }
      }

      // Delete record
      const { error } = await supabase
        .from("health_cards")
        .delete()
        .eq("id", deletingCard.id);

      if (error) throw error;

      toast.success(t("healthCard.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      setDeletingCard(null);
      loadHealthCards();
    } catch (error) {
      console.error("Error deleting health card:", error);
      toast.error(t("healthCard.deleteError"));
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getDaysExpiryText = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return `${Math.abs(days)} ημ. πριν`;
    if (days === 0) return "Σήμερα";
    if (days === 1) return "1 ημέρα";
    return `${days} ημέρες`;
  };

  const getDaysExpiryColor = (endDate: string) => {
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return "text-red-600 font-medium";
    if (days <= 7) return "text-orange-600 font-medium";
    if (days <= 30) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusBadge = (daysLeft: number) => {
    if (daysLeft < 0) {
      return <Badge className="bg-red-100 text-red-800 rounded-none">{t("healthCard.expired")}</Badge>;
    } else if (daysLeft <= 30) {
      return <Badge className="bg-orange-100 text-orange-800 rounded-none">{t("healthCard.active")}</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 rounded-none">{t("healthCard.active")}</Badge>;
    }
  };

  // Filter health cards by search term
  const filteredHealthCards = healthCards
    .filter((card) => {
      const userName = card.user?.name || "";
      const userEmail = card.user?.email || "";
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
    return format(new Date(dateString), "dd/MM/yy");
  };

  return (
    <>
      <Card className="rounded-none text-[#004aad]">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2 text-[#004aad]">
              <HeartPulse className="h-5 w-5 text-[#004aad]" />
              {t("healthCard.title")} ({filteredHealthCards.length})
            </CardTitle>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#004aad] hover:bg-[#004aad]/90 text-white rounded-none w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("healthCard.addNew")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#004aad]/70" />
              <Input
                placeholder="Αναζήτηση με όνομα ή email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-none text-[#004aad] placeholder:text-[#004aad]/70"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#004aad]/70">{t("common.loading")}</p>
            </div>
          ) : filteredHealthCards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#004aad]/70">{t("healthCard.noCards")}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[#004aad]">Χρήστης</TableHead>
                      <TableHead className="text-[#004aad]">Έναρξη</TableHead>
                      <TableHead className="text-[#004aad]">Λήξη</TableHead>
                      <TableHead className="text-[#004aad]">Υπόλοιπο</TableHead>
                      <TableHead className="text-[#004aad]">Κατάσταση</TableHead>
                      <TableHead className="text-right text-[#004aad]">Ενέργειες</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHealthCards.map((card) => {
                      const daysLeft = getDaysUntilExpiry(card.end_date);
                      return (
                        <TableRow key={card.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8 rounded-full">
                                <AvatarImage src={card.user?.photo_url || ''} />
                                <AvatarFallback className="bg-[#004aad]/20 text-[#004aad] rounded-full">
                                  {card.user?.name?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-[#004aad]">{card.user?.name || 'Άγνωστο'}</p>
                                <p className="text-xs text-[#004aad]/70">{card.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(card.start_date)}</TableCell>
                          <TableCell>{formatDate(card.end_date)}</TableCell>
                          <TableCell>
                            <span className={getDaysExpiryColor(card.end_date)}>
                              {getDaysExpiryText(card.end_date)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(daysLeft)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {card.image_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-none"
                                  onClick={() => {
                                    setViewingCard(card);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none"
                                onClick={() => handleOpenEditDialog(card)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeletingCard(card);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredHealthCards.map((card) => {
                  const daysLeft = getDaysUntilExpiry(card.end_date);
                  return (
                    <Card key={card.id} className="rounded-none">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-9 w-9 rounded-full flex-shrink-0">
                              <AvatarImage src={card.user?.photo_url || ''} />
                              <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] rounded-full">
                                {card.user?.name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{card.user?.name || 'Άγνωστο'}</p>
                              <p className="text-xs text-gray-500 truncate">{card.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(daysLeft)}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3 border-t border-b border-border py-2">
                          <div>
                            <p className="text-gray-500">Έναρξη</p>
                            <p className="font-medium">{formatDate(card.start_date)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Λήξη</p>
                            <p className="font-medium">{formatDate(card.end_date)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Υπόλοιπο</p>
                            <p className={getDaysExpiryColor(card.end_date)}>
                              {getDaysExpiryText(card.end_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {card.image_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-none flex-1"
                              onClick={() => {
                                setViewingCard(card);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Προβολή
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-none flex-1"
                            onClick={() => handleOpenEditDialog(card)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Επεξεργασία
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-none text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingCard(card);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Health Card Dialog */}
      <HealthCardFormDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingCard(null);
        }}
        coachId={effectiveCoachId}
        editingCard={editingCard}
        onSaved={loadHealthCards}
      />

      {/* View Health Card Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="rounded-none max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {t("healthCard.certificateOf")} {viewingCard?.user?.name}
            </DialogTitle>
          </DialogHeader>
          {signedImageUrl && (
            signedImageUrl.toLowerCase().endsWith('.pdf') || viewingCard?.image_url?.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={signedImageUrl}
                className="w-full h-[70vh] border-0"
                title="Health Card PDF"
              />
            ) : (
              <img
                src={signedImageUrl}
                alt="Health Card"
                className="w-full object-contain max-h-[70vh]"
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("healthCard.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("healthCard.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHealthCard}
              className="bg-destructive hover:bg-destructive/90 rounded-none"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Admin σελίδα Κάρτας Υγείας (/dashboard/health-cards).
 * Οι coaches ανακατευθύνονται στη δική τους σελίδα (/dashboard/coach-health-cards).
 */
export default function HealthCardsPage() {
  const { t } = useTranslation();
  const { isAdmin, loading: rolesLoading } = useRoleCheck();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!rolesLoading && !isAdmin()) {
    return <Navigate to="/dashboard/coach-health-cards" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {/* Mobile/Tablet sidebar overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative w-64 h-full">
              <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile/Tablet Header */}
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileOpen(true)}
                  className="rounded-none"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <HeartPulse className="h-5 w-5" />
                  {t("healthCard.title")}
                </h1>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <HealthCardsContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
