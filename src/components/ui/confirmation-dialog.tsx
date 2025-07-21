
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
      <AlertDialogContent className="max-w-sm rounded-none bg-white shadow-2xl border-0">
        <div className="p-6 text-center">
          <AlertDialogDescription className="text-gray-800 text-lg font-medium leading-relaxed mb-8">
            {description}
          </AlertDialogDescription>
          
          <div className="flex justify-center gap-3">
            <AlertDialogCancel 
              onClick={onClose}
              className="rounded-none px-8 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 font-medium"
            >
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="rounded-none px-8 py-2 bg-red-600 hover:bg-red-700 text-white border-0 font-medium"
            >
              {confirmText}
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
