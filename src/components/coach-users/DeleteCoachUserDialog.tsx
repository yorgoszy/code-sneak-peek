import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface CoachUser {
  id: string;
  name: string;
  email: string;
}

interface DeleteCoachUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: CoachUser;
  onSuccess: () => void;
}

export const DeleteCoachUserDialog = ({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteCoachUserDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('coach_users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Ο αθλητής διαγράφηκε επιτυχώς");
      onSuccess();
    } catch (error: any) {
      console.error("Error deleting athlete:", error);
      toast.error(error.message || "Σφάλμα κατά τη διαγραφή αθλητή");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Διαγραφή Αθλητή
          </DialogTitle>
          <DialogDescription>
            Είστε σίγουροι ότι θέλετε να διαγράψετε τον αθλητή <strong>{user.name}</strong>? 
            Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
          </DialogDescription>
        </DialogHeader>
        
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
            onClick={handleDelete}
            disabled={loading}
            variant="destructive"
            className="rounded-none"
          >
            {loading ? "Διαγραφή..." : "Διαγραφή"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
