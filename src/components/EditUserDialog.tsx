
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PhotoUpload } from "./PhotoUpload";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  category?: string;
  user_status: string;
  birth_date?: string;
  photo_url?: string;
  created_at: string;
}

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: AppUser | null;
}

export const EditUserDialog = ({ isOpen, onClose, onUserUpdated, user }: EditUserDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRole(user.role || "");
      setCategory(user.category || "");
      setUserStatus(user.user_status || "");
      setBirthDate(user.birth_date || "");
      setPhotoUrl(user.photo_url || null);
    }
  }, [user, isOpen]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Το όνομα και το email είναι υποχρεωτικά",
      });
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        role: role || 'general',
        user_status: userStatus || 'active'
      };

      // Add optional fields only if they have values, otherwise set to null
      userData.phone = phone.trim() || null;
      userData.category = category.trim() || null;
      userData.birth_date = birthDate || null;
      userData.photo_url = photoUrl || null;

      const { error } = await supabase
        .from('app_users')
        .update(userData)
        .eq('id', user.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η ενημέρωση του χρήστη",
        });
      } else {
        toast({
          title: "Επιτυχία",
          description: "Ο χρήστης ενημερώθηκε επιτυχώς",
        });
        onUserUpdated();
        onClose();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά την ενημέρωση του χρήστη",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Χρήστη</DialogTitle>
          <DialogDescription>
            Επεξεργαστείτε τις πληροφορίες του χρήστη. Μόνο το όνομα και το email είναι υποχρεωτικά.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Όνομα *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Εισάγετε το όνομα"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Εισάγετε το email"
              required
            />
          </div>

          <PhotoUpload
            currentPhotoUrl={photoUrl || undefined}
            onPhotoChange={setPhotoUrl}
            disabled={loading}
          />

          <div className="space-y-2">
            <Label htmlFor="phone">Τηλέφωνο</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Εισάγετε το τηλέφωνο"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Ρόλος</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Επιλέξτε ρόλο" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="athlete">Athlete</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Κατηγορία</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Εισάγετε την κατηγορία"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userStatus">Κατάσταση</Label>
            <Select value={userStatus} onValueChange={setUserStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Επιλέξτε κατάσταση" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ενεργός</SelectItem>
                <SelectItem value="inactive">Ανενεργός</SelectItem>
                <SelectItem value="pending">Εκκρεμής</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Ημερομηνία Γέννησης</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-none"
            >
              Ακύρωση
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-none"
            >
              {loading ? "Ενημέρωση..." : "Ενημέρωση"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
