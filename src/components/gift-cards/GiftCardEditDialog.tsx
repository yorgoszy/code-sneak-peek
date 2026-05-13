import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionType {
  id: string;
  name: string;
  price: number;
}

interface GiftCardEditDialogProps {
  giftCard: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  subscriptionTypes: SubscriptionType[];
}

export const GiftCardEditDialog: React.FC<GiftCardEditDialogProps> = ({
  giftCard,
  isOpen,
  onClose,
  onSaved,
  subscriptionTypes,
}) => {
  const [cardType, setCardType] = useState<'amount' | 'subscription'>('amount');
  const [amount, setAmount] = useState('');
  const [subscriptionTypeId, setSubscriptionTypeId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (giftCard) {
      setCardType(giftCard.card_type);
      setAmount(giftCard.amount?.toString() || '');
      setSubscriptionTypeId(giftCard.subscription_type_id || '');
      setSenderName(giftCard.sender_name || '');
      setSenderEmail(giftCard.sender_email || '');
      setRecipientName(giftCard.recipient_name || '');
      setRecipientEmail(giftCard.recipient_email || '');
      setExpiresAt(giftCard.expires_at ? giftCard.expires_at.split('T')[0] : '');
    }
  }, [giftCard]);

  const handleSave = async () => {
    if (!giftCard) return;
    setSaving(true);
    try {
      const updates: any = {
        card_type: cardType,
        sender_name: senderName || null,
        sender_email: senderEmail || null,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (cardType === 'amount') {
        updates.amount = amount ? parseFloat(amount) : null;
        updates.subscription_type_id = null;
      } else {
        updates.subscription_type_id = subscriptionTypeId || null;
        const sub = subscriptionTypes.find(s => s.id === subscriptionTypeId);
        if (sub) updates.amount = sub.price;
      }

      const { error } = await supabase
        .from('gift_cards')
        .update(updates)
        .eq('id', giftCard.id);

      if (error) throw error;
      toast.success('Gift Card ενημερώθηκε');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error updating gift card:', error);
      toast.error('Σφάλμα ενημέρωσης');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-none">
        <DialogHeader>
          <DialogTitle>Επεξεργασία Gift Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Τύπος</Label>
            <Select value={cardType} onValueChange={(v: 'amount' | 'subscription') => setCardType(v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Χρηματικό ποσό</SelectItem>
                <SelectItem value="subscription">Συνδρομή</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {cardType === 'amount' ? (
            <div>
              <Label>Ποσό (€)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-none" />
            </div>
          ) : (
            <div>
              <Label>Συνδρομή</Label>
              <Select value={subscriptionTypeId} onValueChange={setSubscriptionTypeId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε συνδρομή" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionTypes.map(st => (
                    <SelectItem key={st.id} value={st.id}>{st.name} - €{st.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Ημερομηνία λήξης</Label>
            <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="rounded-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Όνομα αποστολέα</Label>
              <Input value={senderName} onChange={e => setSenderName(e.target.value)} className="rounded-none" />
            </div>
            <div>
              <Label>Email αποστολέα</Label>
              <Input value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="rounded-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Όνομα παραλήπτη</Label>
              <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} className="rounded-none" />
            </div>
            <div>
              <Label>Email παραλήπτη</Label>
              <Input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="rounded-none" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-none">Ακύρωση</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-black text-white hover:bg-gray-800 rounded-none">
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
