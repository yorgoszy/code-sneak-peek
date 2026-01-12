import React from 'react';
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
import { Trash2 } from "lucide-react";

interface SubscriptionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onMoveToHistory?: () => void;
}

export const SubscriptionDeleteDialog: React.FC<SubscriptionDeleteDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  onMoveToHistory
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm rounded-none">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-center text-lg font-semibold">
            Διαγραφή Συνδρομής
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-gray-600">
            Είστε σίγουροι ότι θέλετε να διαγράψετε οριστικά αυτή τη συνδρομή; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-3 mt-4 sm:justify-center">
          <AlertDialogCancel 
            onClick={onClose}
            className="rounded-none px-6"
          >
            Ακύρωση
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="rounded-none px-6 bg-destructive hover:bg-destructive/90 text-white"
          >
            Διαγραφή
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
