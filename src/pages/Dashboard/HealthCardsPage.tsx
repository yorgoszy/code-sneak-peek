import { useState, useEffect } from "react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { Menu, HeartPulse, Upload, Trash2, Eye, Pencil, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, addYears } from "date-fns";
import { el } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { matchesSearchTerm } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface UserOption {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  photo_url: string | null;
}

export default function HealthCardsPage() {
  const { t } = useTranslation();
  const { isAdmin, userProfile } = useRoleCheck();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [healthCards, setHealthCards] = useState<HealthCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add/Edit dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<HealthCard | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // User search for dialog
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);

  // View dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingCard, setViewingCard] = useState<HealthCard | null>(null);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<HealthCard | null>(null);

  // Κανόνας: ο καθένας (Admin/Coach) βλέπει ΜΟΝΟ τους δικούς του χρήστες.
  // Άρα πάντα φιλτράρουμε με το δικό του app_users.id (αγνοούμε coachId στο URL).
  const effectiveCoachId = userProfile?.id ?? null;

  // Load users for search dropdown
  useEffect(() => {
    const loadUsers = async () => {
      if (!effectiveCoachId) return;
      const { data, error } = await supabase
        .from("app_users")
        .select("id, name, email, avatar_url, photo_url")
        .eq("coach_id", effectiveCoachId)
        .order("name");
      if (!error && data) {
        setAllUsers(data);
      }
    };
    loadUsers();
  }, [effectiveCoachId]);

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

  const handleAddHealthCard = async () => {
    if (!selectedUser) {
      toast.error(t("healthCard.selectUser"));
      return;
    }

    try {
      setUploading(true);

      // Check if user already has a health card
      const { data: existingCard } = await supabase
        .from("health_cards")
        .select("id, image_url")
        .eq("user_id", selectedUser.id)
        .maybeSingle();

      let imageUrl = existingCard?.image_url || null;

      // Upload new image if provided
      if (selectedFile) {
        // If exists, delete old image
        if (existingCard?.image_url) {
          const oldPath = existingCard.image_url.split("/").pop();
          if (oldPath) {
            await supabase.storage.from("health-cards").remove([oldPath]);
          }
        }

        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${selectedUser.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("health-cards")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("health-cards")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const startDateObj = new Date(startDate);
      const endDateObj = addYears(startDateObj, 1);

      // Upsert health card
      const { error: upsertError } = await supabase.from("health_cards").upsert(
        {
          user_id: selectedUser.id,
          image_url: imageUrl,
          start_date: startDate,
          end_date: format(endDateObj, "yyyy-MM-dd"),
          notification_sent: false,
        },
        { onConflict: "user_id" }
      );

      if (upsertError) throw upsertError;

      toast.success(editingCard ? t("healthCard.updateSuccess") : t("healthCard.uploadSuccess"));
      handleCloseDialog();
      loadHealthCards();
    } catch (error) {
      console.error("Error uploading health card:", error);
      toast.error(t("healthCard.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEditDialog = (card: HealthCard) => {
    setEditingCard(card);
    // Find user from allUsers or create a temp object
    const user = allUsers.find(u => u.id === card.user_id) || {
      id: card.user_id,
      name: card.user?.name || '',
      email: card.user?.email || '',
      avatar_url: null,
      photo_url: card.user?.photo_url || null,
    };
    setSelectedUser(user);
    setStartDate(card.start_date);
    setSelectedFile(null);
    setUserSearchTerm('');
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCard(null);
    setSelectedUser(null);
    setSelectedFile(null);
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setUserSearchTerm('');
  };

  // Filter users for search
  const filteredUsers = allUsers.filter(u => 
    matchesSearchTerm(u.name, userSearchTerm) || 
    matchesSearchTerm(u.email, userSearchTerm)
  );

  const handleDeleteHealthCard = async () => {
    if (!deletingCard) return;

    try {
      // Delete image from storage
      if (deletingCard.image_url) {
        const path = deletingCard.image_url.split("/").pop();
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

  const renderSidebar = () => {
    if (isAdmin()) {
      return (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      );
    }
    return (
      <CoachSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        contextCoachId={effectiveCoachId || undefined}
      />
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">{renderSidebar()}</div>

        {/* Mobile/Tablet sidebar overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
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
            <Card className="rounded-none">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-[#00ffba]" />
                    {t("healthCard.title")} ({filteredHealthCards.length})
                  </CardTitle>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full sm:w-auto"
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Αναζήτηση με όνομα ή email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-none"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t("common.loading")}</p>
                  </div>
                ) : filteredHealthCards.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t("healthCard.noCards")}</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Χρήστης</TableHead>
                            <TableHead>Έναρξη</TableHead>
                            <TableHead>Λήξη</TableHead>
                            <TableHead>Υπόλοιπο</TableHead>
                            <TableHead>Κατάσταση</TableHead>
                            <TableHead className="text-right">Ενέργειες</TableHead>
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
                                      <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] rounded-full">
                                        {card.user?.name?.charAt(0).toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{card.user?.name || 'Άγνωστο'}</p>
                                      <p className="text-xs text-gray-500">{card.user?.email}</p>
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
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10 rounded-full">
                                    <AvatarImage src={card.user?.photo_url || ''} />
                                    <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] rounded-full">
                                      {card.user?.name?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{card.user?.name || 'Άγνωστο'}</p>
                                    <p className="text-xs text-gray-500">{card.user?.email}</p>
                                  </div>
                                </div>
                                {getStatusBadge(daysLeft)}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                  <span className="text-gray-500">Λήξη:</span>
                                  <span className={`ml-1 ${getDaysExpiryColor(card.end_date)}`}>
                                    {getDaysExpiryText(card.end_date)}
                                  </span>
                                </div>
                              </div>
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
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Add/Edit Health Card Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseDialog();
        else setIsAddDialogOpen(true);
      }}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? t("healthCard.edit") : t("healthCard.addNew")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* User Selection - same pattern as NewSubscriptionDialog */}
            <div className="space-y-2">
              <Label>{t("healthCard.selectUser")}</Label>
              {selectedUser ? (
                <div className="flex items-center gap-3 p-3 border border-border bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.photo_url || selectedUser.avatar_url || undefined} />
                    <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  {!editingCard && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedUser(null)}
                      className="rounded-none"
                    >
                      Αλλαγή
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Αναζήτηση με όνομα ή email..."
                      className="pl-10 rounded-none"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-border bg-background">
                    {userSearchTerm.trim().length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        Πληκτρολογήστε για αναζήτηση...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        Δεν βρέθηκαν χρήστες
                      </div>
                    ) : (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserSearchTerm('');
                          }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photo_url || user.avatar_url || undefined} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>{t("healthCard.startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>
                {t("healthCard.certificate")} 
                {!editingCard && <span className="text-muted-foreground text-xs ml-1">({t("common.optional")})</span>}
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="rounded-none"
              />
              {editingCard?.image_url && !selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("healthCard.currentImageKept")}
                </p>
              )}
            </div>
            <Button
              onClick={handleAddHealthCard}
              disabled={uploading || !selectedUser}
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              {uploading ? t("common.uploading") : (editingCard ? t("common.save") : t("healthCard.upload"))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Health Card Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="rounded-none max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("healthCard.certificateOf")} {viewingCard?.user?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingCard?.image_url && (
            <img
              src={viewingCard.image_url}
              alt="Health Card"
              className="w-full object-contain max-h-[70vh]"
            />
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
    </SidebarProvider>
  );
}
