import { useState, useRef } from "react";
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

interface NewCoachUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  coachId: string;
}

export const NewCoachUserDialog = ({
  open,
  onOpenChange,
  onSuccess,
  coachId,
}: NewCoachUserDialogProps) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Το αρχείο είναι πολύ μεγάλο (max 5MB)");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${coachId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('coach-user-avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return null;
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
      // Δημιουργία αθλητή πρώτα
      const { data: newUser, error } = await supabase
        .from('coach_users')
        .insert({
          coach_id: coachId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          birth_date: formData.birth_date || null,
          notes: formData.notes.trim() || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Upload avatar αν υπάρχει
      if (avatarFile && newUser) {
        const avatarUrl = await uploadAvatar(newUser.id);
        if (avatarUrl) {
          await supabase
            .from('coach_users')
            .update({ avatar_url: avatarUrl })
            .eq('id', newUser.id);
        }
      }

      toast.success("Ο αθλητής προστέθηκε επιτυχώς");
      setFormData({ name: "", email: "", phone: "", birth_date: "", gender: "", notes: "" });
      clearAvatar();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating athlete:", error);
      toast.error(error.message || "Σφάλμα κατά τη δημιουργία αθλητή");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setFormData({ name: "", email: "", phone: "", birth_date: "", gender: "", notes: "" });
      clearAvatar();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle>Νέος Αθλητής</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={avatarPreview || ''} />
                <AvatarFallback className="bg-[#00ffba]/20 text-[#00ffba] text-2xl">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : <Camera className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-none text-xs"
            >
              <Camera className="h-3 w-3 mr-1" />
              {avatarPreview ? 'Αλλαγή Φωτογραφίας' : 'Προσθήκη Φωτογραφίας'}
            </Button>
          </div>

          <div>
            <Label htmlFor="name">Όνομα *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ονοματεπώνυμο"
              className="rounded-none"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              className="rounded-none"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Τηλέφωνο</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="69XXXXXXXX"
              className="rounded-none"
            />
          </div>
          
          <div>
            <Label htmlFor="birth_date">Ημερομηνία Γέννησης</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="gender">Φύλο</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε φύλο" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Άνδρας</SelectItem>
                <SelectItem value="female">Γυναίκα</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Σημειώσεις</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Σημειώσεις για τον αθλητή..."
              className="rounded-none"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {loading ? "Αποθήκευση..." : "Αποθήκευση"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
