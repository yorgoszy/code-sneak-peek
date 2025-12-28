import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    notes: "",
  });

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
        .insert({
          coach_id: coachId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          birth_date: formData.birth_date || null,
          notes: formData.notes.trim() || null,
          status: 'active',
        });

      if (error) throw error;

      toast.success("Ο αθλητής προστέθηκε επιτυχώς");
      setFormData({ name: "", email: "", phone: "", birth_date: "", notes: "" });
      onSuccess();
    } catch (error: any) {
      console.error("Error creating athlete:", error);
      toast.error(error.message || "Σφάλμα κατά τη δημιουργία αθλητή");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle>Νέος Αθλητής</DialogTitle>
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
