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

interface SubscriptionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onMoveToHistory: () => void;
}

export const SubscriptionDeleteDialog: React.FC<SubscriptionDeleteDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  onMoveToHistory
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
              onMoveToHistory();
              onClose();
            }}
            className="rounded-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Μεταφορά στο Ιστορικό
          </AlertDialogAction>
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