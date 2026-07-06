import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReceiptConfirmResult {
  isPaid: boolean;
  giftCardId?: string;
  giftCardAmount?: number;
  appliedCredit?: number;
  newCreditToStore?: number;
  amountToPay?: number;
}

interface ReceiptConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: ReceiptConfirmResult) => void;
  userId?: string;
  subscriptionName?: string;
  subscriptionPrice?: number;
}

interface ValidatedCard {
  id: string;
  code: string;
  amount: number;
}

export const ReceiptConfirmDialog: React.FC<ReceiptConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userId,
  subscriptionName,
  subscriptionPrice = 0,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [validatedCard, setValidatedCard] = useState<ValidatedCard | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const [creditBalance, setCreditBalance] = useState(0);
  const [useCredit, setUseCredit] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsSubmitting(false);
    setGiftCardCode('');
    setValidatedCard(null);
    setValidationError(null);
    setValidating(false);
    setUseCredit(false);
    setCreditBalance(0);

    if (userId) {
      supabase
        .rpc('get_user_credit_balance', { _user_id: userId })
        .then(({ data, error }) => {
          if (!error && data != null) setCreditBalance(Number(data) || 0);
        });
    }
  }, [isOpen, userId]);

  const price = Number(subscriptionPrice) || 0;
  const giftAmount = validatedCard?.amount || 0;
  const appliedCredit = useCredit ? Math.min(creditBalance, Math.max(0, price - giftAmount)) : 0;
  const remaining = Math.max(0, price - giftAmount - appliedCredit);
  const newCreditToStore = Math.max(0, giftAmount + appliedCredit - price + (useCredit ? 0 : 0)) > 0
    ? Math.max(0, giftAmount - Math.max(0, price - appliedCredit))
    : 0;
  // Simpler: leftover from gift card after paying subscription (credit used first-not stored)
  const leftoverFromCard = validatedCard ? Math.max(0, giftAmount - Math.max(0, price - appliedCredit)) : 0;

  const validateCode = async () => {
    const code = giftCardCode.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    setValidationError(null);
    setValidatedCard(null);
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('id, code, amount, status, expires_at')
        .eq('code', code)
        .maybeSingle();

      if (error || !data) {
        setValidationError('Η δωροκάρτα δεν βρέθηκε');
      } else if (data.status !== 'active') {
        setValidationError(
          data.status === 'redeemed'
            ? 'Η δωροκάρτα έχει ήδη εξαργυρωθεί'
            : 'Η δωροκάρτα δεν είναι ενεργή'
        );
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setValidationError('Η δωροκάρτα έχει λήξει');
      } else {
        setValidatedCard({ id: data.id, code: data.code, amount: Number(data.amount) || 0 });
      }
    } catch (e: any) {
      setValidationError(e.message || 'Σφάλμα ελέγχου');
    } finally {
      setValidating(false);
    }
  };

  const submit = (isPaid: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onConfirm({
      isPaid,
      giftCardId: validatedCard?.id,
      giftCardAmount: validatedCard?.amount,
      appliedCredit: appliedCredit > 0 ? appliedCredit : undefined,
      newCreditToStore: leftoverFromCard > 0 ? leftoverFromCard : undefined,
      amountToPay: remaining,
    });
    onClose();
  };

  const fmt = (n: number) => `€${n.toFixed(2)}`;
  const fullyCovered = remaining === 0 && (giftAmount > 0 || appliedCredit > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle>Πληρωμή Συνδρομής</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {subscriptionName && (
            <div className="flex justify-between items-center border-b border-black pb-2">
              <div>
                <div className="text-xs text-muted-foreground">Συνδρομή</div>
                <div className="font-semibold">{subscriptionName}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Τιμή</div>
                <div className="font-semibold">{fmt(price)}</div>
              </div>
            </div>
          )}

          {creditBalance > 0 && (
            <div className="border border-black p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4" />
                  Διαθέσιμη πίστωση
                </Label>
                <span className="font-mono font-semibold text-[#cb8954]">{fmt(creditBalance)}</span>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={useCredit}
                  onCheckedChange={(v) => setUseCredit(v === true)}
                  className="rounded-none"
                />
                <span>Χρήση πίστωσης για αυτή τη συνδρομή</span>
              </label>
            </div>
          )}

          <div className="border border-black p-3 space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Gift className="h-4 w-4" />
              Κωδικός Δωροκάρτας (προαιρετικό)
            </Label>
            <div className="flex gap-2">
              <Input
                value={giftCardCode}
                onChange={(e) => {
                  setGiftCardCode(e.target.value.toUpperCase());
                  setValidatedCard(null);
                  setValidationError(null);
                }}
                placeholder="π.χ. ABCD-1234-EFGH"
                className="rounded-none font-mono uppercase"
                disabled={isSubmitting || validating || !!validatedCard}
              />
              {validatedCard ? (
                <Button
                  onClick={() => {
                    setValidatedCard(null);
                    setGiftCardCode('');
                  }}
                  variant="outline"
                  className="rounded-none"
                  disabled={isSubmitting}
                >
                  Αλλαγή
                </Button>
              ) : (
                <Button
                  onClick={validateCode}
                  disabled={!giftCardCode.trim() || validating || isSubmitting}
                  className="bg-black text-white hover:bg-gray-800 rounded-none whitespace-nowrap"
                >
                  {validating ? '...' : 'Έλεγχος'}
                </Button>
              )}
            </div>
            {validatedCard && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Έγκυρη — Αξία: <span className="font-semibold">{fmt(validatedCard.amount)}</span>
              </div>
            )}
            {validationError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border border-black p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Τιμή συνδρομής</span>
              <span className="font-mono">{fmt(price)}</span>
            </div>
            {appliedCredit > 0 && (
              <div className="flex justify-between text-[#cb8954]">
                <span>− Πίστωση</span>
                <span className="font-mono">−{fmt(appliedCredit)}</span>
              </div>
            )}
            {giftAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>− Δωροκάρτα</span>
                <span className="font-mono">−{fmt(Math.min(giftAmount, price - appliedCredit))}</span>
              </div>
            )}
            <div className="border-t border-black pt-1 flex justify-between font-semibold">
              <span>Υπόλοιπο προς πληρωμή</span>
              <span className="font-mono">{fmt(remaining)}</span>
            </div>
            {leftoverFromCard > 0 && (
              <div className="flex justify-between text-[#cb8954] italic">
                <span>Νέα πίστωση προς αποθήκευση</span>
                <span className="font-mono">+{fmt(leftoverFromCard)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {fullyCovered ? (
              <Button
                onClick={() => submit(true)}
                disabled={isSubmitting}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none px-6"
              >
                Ολοκλήρωση Εξαργύρωσης
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => submit(true)}
                  disabled={isSubmitting}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none px-6"
                >
                  Πληρωμή {fmt(remaining)}
                </Button>
                <Button
                  onClick={() => submit(false)}
                  disabled={isSubmitting}
                  variant="outline"
                  className="rounded-none px-6 border-red-300 text-red-600 hover:bg-red-50"
                >
                  Χωρίς πληρωμή
                </Button>
              </>
            )}
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
