
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";

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

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
  user: AppUser | null;
}

export const DeleteUserDialog = ({ isOpen, onClose, onUserDeleted, user }: DeleteUserDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      console.log('Attempting to delete user:', user.id);
      
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', user.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error(`Σφάλμα: ${error.message}`);
      } else {
        console.log('User deleted successfully');
        toast.success("Ο χρήστης και όλα τα σχετικά δεδομένα διαγράφηκαν επιτυχώς");
        onUserDeleted();
        onClose();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Προέκυψε σφάλμα κατά τη διαγραφή του χρήστη");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Διαγραφή Χρήστη</AlertDialogTitle>
          <AlertDialogDescription>
            Είστε σίγουροι ότι θέλετε να διαγράψετε τον χρήστη "{user?.name}"? 
            <br /><br />
            <strong>Προσοχή:</strong> Θα διαγραφούν επίσης όλα τα σχετικά δεδομένα:
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>Όλα τα τεστ του χρήστη</li>
              <li>Πληρωμές</li>
              <li>Κρατήσεις</li>
              <li>Αποτελέσματα τεστ</li>
            </ul>
            <br />
            Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Διαγραφή..." : "Διαγραφή"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
