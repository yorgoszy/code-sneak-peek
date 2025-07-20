import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReceiptConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (createReceipt: boolean) => void;
}

export const ReceiptConfirmDialog: React.FC<ReceiptConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Απόδειξη</DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <p className="text-lg mb-6">Θέλετε να κοπεί απόδειξη για αυτή τη συνδρομή;</p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => onConfirm(true)}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none px-6"
            >
              Ναι
            </Button>
            <Button
              onClick={() => onConfirm(false)}
              variant="outline"
              className="rounded-none px-6"
            >
              Όχι
            </Button>
            <Button
              onClick={onClose}
              variant="destructive"
              className="rounded-none px-6"
            >
              Ακύρωση
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};