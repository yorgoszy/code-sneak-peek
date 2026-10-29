import { useState, useEffect } from "react";
import { format, addYears } from "date-fns";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { matchesSearchTerm } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { BlueDatePicker } from "@/components/ui/blue-date-picker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface HealthCardFormEditing {
  id: string;
  user_id: string;
  image_url: string | null;
  start_date: string;
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

interface HealthCardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ο coach του οποίου οι αθλητές εμφανίζονται στην αναζήτηση */
  coachId: string | null;
  /** Όταν δοθεί, ο διάλογος λειτουργεί σε edit mode */
  editingCard?: HealthCardFormEditing | null;
  onSaved?: () => void;
}

/**
 * Διάλογος προσθήκης/επεξεργασίας Κάρτας Υγείας.
 * Χρησιμοποιείται από τη σελίδα Κάρτας Υγείας και από την Επισκόπηση του coach.
 */
export const HealthCardFormDialog = ({
  open,
  onOpenChange,
  coachId,
  editingCard,
  onSaved,
}: HealthCardFormDialogProps) => {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);

  // Load coach's users for search dropdown
  useEffect(() => {
    if (!open || !coachId) return;
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("app_users")
        .select("id, name, email, avatar_url, photo_url")
        .eq("coach_id", coachId)
        .order("name");
      if (!error && data) {
        setAllUsers(data);
      }
    };
    loadUsers();
  }, [open, coachId]);

  // Reset/populate form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (editingCard) {
      setSelectedUser({
        id: editingCard.user_id,
        name: editingCard.user?.name || "",
        email: editingCard.user?.email || "",
        avatar_url: null,
        photo_url: editingCard.user?.photo_url || null,
      });
      setStartDate(editingCard.start_date);
    } else {
      setSelectedUser(null);
      setStartDate(format(new Date(), "yyyy-MM-dd"));
    }
    setSelectedFile(null);
    setUserSearchTerm("");
  }, [open, editingCard]);

  // Prefer the fresh user record once the list loads
  const displayedUser = selectedUser
    ? allUsers.find((u) => u.id === selectedUser.id) ?? selectedUser
    : null;

  const filteredUsers = allUsers.filter(
    (u) =>
      matchesSearchTerm(u.name, userSearchTerm) ||
      matchesSearchTerm(u.email, userSearchTerm)
  );

  const handleSave = async () => {
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
          const oldPath =
            existingCard.image_url.split("/health-cards/")[1] ||
            existingCard.image_url.split("/").pop();
          if (oldPath) {
            await supabase.storage.from("health-cards").remove([oldPath]);
          }
        }

        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${selectedUser.id}/health-card-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("health-cards")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // Store the path, not the public URL (bucket is private)
        imageUrl = fileName;
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
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error uploading health card:", error);
      toast.error(t("healthCard.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none text-[#004aad]">
        <DialogHeader>
          <DialogTitle>
            {editingCard ? t("healthCard.edit") : t("healthCard.addNew")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* User Selection - same pattern as NewSubscriptionDialog */}
          <div className="space-y-2">
            <Label>{t("healthCard.selectUser")}</Label>
            {displayedUser ? (
              <div className="flex items-center gap-3 p-3 border border-border bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={displayedUser.photo_url || displayedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#004aad]/20 text-[#004aad]">{displayedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{displayedUser.name}</p>
                  <p className="text-sm text-[#004aad]/70">{displayedUser.email}</p>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#004aad]/70" />
                  <Input
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Αναζήτηση με όνομα ή email..."
                    className="pl-10 rounded-none placeholder:text-[#004aad]/70"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-border bg-background">
                  {userSearchTerm.trim().length === 0 ? (
                    <div className="p-3 text-center text-[#004aad]/70 text-sm">
                      Πληκτρολογήστε για αναζήτηση...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-3 text-center text-[#004aad]/70 text-sm">
                      Δεν βρέθηκαν χρήστες
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearchTerm("");
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photo_url || user.avatar_url || undefined} />
                          <AvatarFallback className="bg-[#004aad]/20 text-[#004aad]">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-[#004aad]/70">{user.email}</p>
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
            <BlueDatePicker
              value={startDate}
              onChange={setStartDate}
              className="w-full"
            />
          </div>
          <div>
            <Label>
              {t("healthCard.certificate")}
              {!editingCard && (
                <span className="text-[#004aad]/70 text-xs ml-1">({t("common.optional")})</span>
              )}
            </Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="rounded-none text-[#004aad]"
            />
            {editingCard?.image_url && !selectedFile && (
              <p className="text-xs text-[#004aad]/70 mt-1">
                {t("healthCard.currentImageKept")}
              </p>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={uploading || !selectedUser}
            className="w-full rounded-none bg-[#004aad] hover:bg-[rgba(0,74,173,0.7)] text-white"
          >
            {uploading ? t("common.uploading") : editingCard ? t("common.save") : t("healthCard.upload")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
