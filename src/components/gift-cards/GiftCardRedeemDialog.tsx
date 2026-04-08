import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GiftCardRedeemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GiftCardRedeemDialog: React.FC<GiftCardRedeemDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // Find the gift card
      const { data: giftCard, error: findError } = await supabase
        .from('gift_cards')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('status', 'active')
        .single();

      if (findError || !giftCard) {
        setResult('error');
        setErrorMessage('Ο κωδικός δεν βρέθηκε ή δεν είναι ενεργός');
        return;
      }

      // Check expiry
      if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
        setResult('error');
        setErrorMessage('Αυτό το gift card έχει λήξει');
        return;
      }

      // Get current user
      const { data: currentUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!currentUser) {
        setResult('error');
        setErrorMessage('Πρέπει να είστε συνδεδεμένος');
        return;
      }

      // Mark as redeemed
      const { error: updateError } = await supabase
        .from('gift_cards')
        .update({
          status: 'redeemed',
          redeemed_by: currentUser.id,
          redeemed_at: new Date().toISOString()
        })
        .eq('id', giftCard.id);

      if (updateError) throw updateError;

      setResult('success');
      toast.success(`Gift Card €${giftCard.amount} εξαργυρώθηκε!`);
      onSuccess?.();
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      setResult('error');
      setErrorMessage('Σφάλμα κατά την εξαργύρωση');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setResult(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Εξαργύρωση Gift Card
          </DialogTitle>
        </DialogHeader>

        {result === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-[#00ffba] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Επιτυχής εξαργύρωση!</h3>
            <p className="text-muted-foreground">Το gift card ενεργοποιήθηκε στον λογαριασμό σας</p>
            <Button onClick={handleClose} className="mt-4 bg-black text-white hover:bg-gray-800 rounded-none">
              Κλείσιμο
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Κωδικός Gift Card</Label>
              <Input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="rounded-none font-mono text-lg text-center tracking-widest"
                maxLength={14}
              />
            </div>

            {result === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <Button
              onClick={handleRedeem}
              disabled={loading || !code.trim()}
              className="w-full bg-[#00ffba] text-black hover:bg-[#00ffba]/90 rounded-none font-semibold"
            >
              {loading ? 'Εξαργύρωση...' : 'Εξαργύρωση'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
