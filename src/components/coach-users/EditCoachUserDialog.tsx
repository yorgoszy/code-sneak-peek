import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CoachUser {
  id: string;
  coach_id: string;
  name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  avatar_url?: string;
  notes?: string;
  status: string;
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    notes: "",
    status: "active",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        birth_date: user.birth_date || "",
        notes: user.notes || "",
        status: user.status || "active",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Το όνομα και το email είναι υποχρεωτικά");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('coach_users')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          birth_date: formData.birth_date || null,
          notes: formData.notes.trim() || null,
          status: formData.status,
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
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Αθλητή</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="status">Κατάσταση</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ενεργός</SelectItem>
                <SelectItem value="inactive">Ανενεργός</SelectItem>
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
              onClick={() => onOpenChange(false)}
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
