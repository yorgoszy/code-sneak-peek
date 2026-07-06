import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift } from "lucide-react";

interface ReceiptConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isPaid: boolean, giftCardCode?: string) => void;
}

export const ReceiptConfirmDialog: React.FC<ReceiptConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');

  const handleConfirm = (isPaid: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const code = giftCardCode.trim().toUpperCase();
    onConfirm(isPaid, code || undefined);
    onClose();
  };

  const handleRedeemGiftCard = () => {
    if (isSubmitting) return;
    const code = giftCardCode.trim().toUpperCase();
    if (!code) return;
    setIsSubmitting(true);
    // Gift card redemption implies paid
    onConfirm(true, code);
    onClose();
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setGiftCardCode('');
    }
  }, [isOpen]);

  const hasCode = giftCardCode.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Πληρωμή</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-lg text-center">Είναι πληρωμένη η συνδρομή;</p>

          <div className="space-y-2 border border-black p-3">
            <Label className="flex items-center gap-2 text-sm">
              <Gift className="h-4 w-4" />
              Κωδικός Δωροκάρτας (προαιρετικό)
            </Label>
            <Input
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
              placeholder="π.χ. ABCD-1234"
              className="rounded-none font-mono uppercase"
              disabled={isSubmitting}
            />
            {hasCode && (
              <Button
                onClick={handleRedeemGiftCard}
                disabled={isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 rounded-none"
              >
                Εξαργύρωση Δωροκάρτας
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={() => handleConfirm(true)}
              disabled={isSubmitting || hasCode}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none px-6"
            >
              Ναι
            </Button>
            <Button
              onClick={() => handleConfirm(false)}
              disabled={isSubmitting || hasCode}
              variant="outline"
              className="rounded-none px-6 border-red-300 text-red-600 hover:bg-red-50"
            >
              Όχι
            </Button>
            <Button
              onClick={onClose}
              variant="destructive"
              className="rounded-none px-6"
              disabled={isSubmitting}
            >
              Ακύρωση
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
