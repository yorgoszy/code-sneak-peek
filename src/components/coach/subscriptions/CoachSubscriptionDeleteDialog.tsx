import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";

interface CoachSubscriptionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const CoachSubscriptionDeleteDialog: React.FC<CoachSubscriptionDeleteDialogProps> = ({
  isOpen,
  onClose,
  onDelete
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md rounded-none fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <AlertDialogHeader>
          <AlertDialogDescription className="text-center text-base font-medium">
            Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συνδρομή;
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-3 mt-6">
          <AlertDialogCancel 
            onClick={onClose}
            className="rounded-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            Ακύρωση
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="rounded-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
          >
            Διαγραφή
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
