
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserDeletionService } from "./userDeletionService";
import type { AppUser } from "./types";

export const useUserDeletion = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteUser = async (
    user: AppUser,
    onUserDeleted: () => void,
    onClose: () => void
  ) => {
    if (!user) return;
    
    setLoading(true);

    try {
      await UserDeletionService.deleteUserData(user);

      toast({
        title: "Επιτυχία",
        description: "Ο χρήστης διαγράφηκε επιτυχώς",
      });
      
      onUserDeleted();
      onClose();
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: error instanceof Error ? error.message : "Προέκυψε σφάλμα κατά τη διαγραφή του χρήστη",
      });
    } finally {
      setLoading(false);
    }
  };

  return { deleteUser, loading };
};
