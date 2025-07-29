
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
      <AlertDialogContent className="max-w-md rounded-none bg-white shadow-2xl border-0 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="p-8 text-center">
          <AlertDialogDescription className="text-gray-800 text-lg font-medium leading-relaxed mb-8">
            {description}
          </AlertDialogDescription>
          
          <div className="flex justify-center gap-4">
            <AlertDialogCancel 
              onClick={onClose}
              className="rounded-none px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 font-medium transition-colors"
            >
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="rounded-none px-8 py-3 bg-red-600 hover:bg-red-700 text-white border-0 font-medium transition-colors"
            >
              {confirmText}
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
