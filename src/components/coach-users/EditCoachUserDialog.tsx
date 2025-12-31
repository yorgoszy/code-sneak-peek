import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import { processAvatarImage } from "@/utils/imageProcessing";

interface CoachUser {
  id: string;
  coach_id: string;
  name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  avatar_url?: string;
  notes?: string;
  user_status: string;
  created_at: string;
  updated_at: string;
}

interface EditCoachUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: CoachUser;
  onSuccess: () => void;
}

export const EditCoachUserDialog = ({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditCoachUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        birth_date: user.birth_date || "",
        gender: user.gender || "",
        notes: user.notes || "",
      });
      setAvatarPreview(user.avatar_url || null);
      setAvatarFile(null);
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Το αρχείο είναι πολύ μεγάλο (max 10MB)");
        return;
      }
      
      try {
        // Process the image for preview
        const processed = await processAvatarImage(file);
        setAvatarFile(new File([processed.blob], 'avatar.jpg', { type: 'image/jpeg' }));
        
        // Create preview URL from processed blob
        const previewUrl = URL.createObjectURL(processed.blob);
        setAvatarPreview(previewUrl);
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error("Σφάλμα κατά την επεξεργασία της εικόνας");
      }
    }
  };

  const clearAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return user.avatar_url || null;

    const fileName = `${user.id}.jpg`;
    const filePath = `${user.coach_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('coach-user-avatars')
      .upload(filePath, avatarFile, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return user.avatar_url || null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('coach-user-avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Το όνομα και το email είναι υποχρεωτικά");
      return;
    }

    setLoading(true);
    try {
      // Upload avatar αν υπάρχει νέο αρχείο
      const avatarUrl = await uploadAvatar();

      // Update στο app_users αντί coach_users
      const { error } = await supabase
        .from('app_users')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          birth_date: formData.birth_date || null,
          gender: formData.gender || null,
          notes: formData.notes.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Ο αθλητής ενημερώθηκε επιτυχώς");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating athlete:", error);
      toast.error(error.message || "Σφάλμα κατά την ενημέρωση αθλητή");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Επεξεργασία Αθλητή</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Avatar + Name Row */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-12 w-12 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={avatarPreview || ''} />
                <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] text-lg">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : <Camera className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex-1">
              <Label htmlFor="name" className="text-xs">Όνομα *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ονοματεπώνυμο"
                className="rounded-none h-8 text-sm"
                required
              />
            </div>
          </div>

          {/* Email + Phone Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email" className="text-xs">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="rounded-none h-8 text-sm"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs">Τηλέφωνο</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="69XXXXXXXX"
                className="rounded-none h-8 text-sm"
              />
            </div>
          </div>

          {/* Birth Date + Gender Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="birth_date" className="text-xs">Ημ. Γέννησης</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="rounded-none h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-xs">Φύλο</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger className="rounded-none h-8 text-sm">
                  <SelectValue placeholder="Επιλέξτε" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Άνδρας</SelectItem>
                  <SelectItem value="female">Γυναίκα</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-xs">Σημειώσεις</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Σημειώσεις για τον αθλητή..."
              className="rounded-none text-sm resize-none"
              rows={2}
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-none h-8"
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none h-8"
            >
              {loading ? "Αποθήκευση..." : "Αποθήκευση"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};