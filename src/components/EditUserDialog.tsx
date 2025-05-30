
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  category?: string;
  user_status: string;
  birth_date?: string;
  created_at: string;
}

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: AppUser | null;
}

export const EditUserDialog = ({ isOpen, onClose, onUserUpdated, user }: EditUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "general",
    birth_date: "",
    role: "athlete",
    user_status: "active"
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        category: user.category || "general",
        birth_date: user.birth_date || "",
        role: user.role || "athlete",
        user_status: user.user_status || "active"
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('app_users')
        .update(formData)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Χρήστη</DialogTitle>
          <DialogDescription>
            Επεξεργαστείτε τα στοιχεία του χρήστη
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ονοματεπώνυμο</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Τηλέφωνο</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birth_date">Ημερομηνία Γέννησης</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Ρόλος</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Επιλέξτε κατηγορία" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="youth">Youth</SelectItem>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Κατάσταση</Label>
            <Select value={formData.user_status} onValueChange={(value) => setFormData({ ...formData, user_status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Επιλέξτε κατάσταση" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-none">
              Ακύρωση
            </Button>
            <Button type="submit" disabled={loading} className="rounded-none">
              {loading ? "Ενημέρωση..." : "Ενημέρωση"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
