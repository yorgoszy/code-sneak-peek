
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

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Επιβεβαίωση",
  description = "Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;",
  confirmText = "ΟΚ",
  cancelText = "Ακύρωση"
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md rounded-none fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <AlertDialogHeader>
          <AlertDialogDescription className="text-center text-base font-medium">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-4 mt-6">
          <AlertDialogCancel 
            onClick={onClose}
            className="rounded-none px-6"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="rounded-none px-6 bg-red-600 hover:bg-red-700"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
