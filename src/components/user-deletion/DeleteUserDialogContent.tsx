
import React from "react";
import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { AppUser } from "./types";

interface DeleteUserDialogContentProps {
  user: AppUser | null;
  loading: boolean;
  onDelete: () => void;
  onClose: () => void;
}

export const DeleteUserDialogContent: React.FC<DeleteUserDialogContentProps> = ({
  user,
  loading,
  onDelete,
  onClose
}) => {
  return (
    <AlertDialogContent className="rounded-none">
      <AlertDialogHeader>
        <AlertDialogTitle>Διαγραφή Χρήστη</AlertDialogTitle>
        <AlertDialogDescription>
          Είστε σίγουροι ότι θέλετε να διαγράψετε τον χρήστη "{user?.name}"? 
          <br /><br />
          <strong>Προσοχή:</strong> Θα διαγραφούν επίσης όλα τα δεδομένα του χρήστη (προπονήσεις, τεστ, αναθέσεις προγραμμάτων κ.λπ.).
          <br />
          Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="rounded-none" onClick={onClose}>
          Ακύρωση
        </AlertDialogCancel>
        <AlertDialogAction 
          onClick={onDelete} 
          disabled={loading}
          className="rounded-none bg-red-600 hover:bg-red-700"
        >
          {loading ? "Διαγραφή..." : "Διαγραφή"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};
