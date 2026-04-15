import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, ArrowRight, ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number | null;
}

interface GiftCardPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GiftCardPurchaseDialog: React.FC<GiftCardPurchaseDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [step, setStep] = useState<'select' | 'email'>('select');
  const [selectedType, setSelectedType] = useState<SubscriptionType | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionTypes();
      setStep('select');
      setSelectedType(null);
      setRecipientEmail('');
    }
  }, [isOpen]);

  const fetchSubscriptionTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, description, price, duration_months')
        .eq('is_active', true)
        .eq('is_gift_card', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
      toast.error('Σφάλμα φόρτωσης υπηρεσιών');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type: SubscriptionType) => {
    setSelectedType(type);
    setStep('email');
  };

  const handlePurchase = async () => {
    if (!selectedType || !recipientEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Παρακαλώ εισάγετε ένα έγκυρο email');
      return;
    }

    setPurchasing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Πρέπει να συνδεθείτε πρώτα');
        onClose();
        window.location.href = '/auth?redirect=gift-card';
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-gift-card-checkout', {
        body: {
          subscription_type_id: selectedType.id,
          subscription_type_name: selectedType.name,
          amount: selectedType.price,
          recipient_email: recipientEmail
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Σφάλμα δημιουργίας πληρωμής');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-['Roobert_Pro',sans-serif]">
            <Gift className="h-5 w-5" />
            {step === 'select' ? 'Επιλέξτε υπηρεσία Gift Card' : 'Στοιχεία παραλήπτη'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <>
            <p className="text-sm text-gray-500 font-['Roobert_Pro',sans-serif]">
              Επιλέξτε την υπηρεσία που θέλετε να χαρίσετε
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : subscriptionTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-['Roobert_Pro',sans-serif]">
                Δεν υπάρχουν διαθέσιμες υπηρεσίες αυτή τη στιγμή
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {subscriptionTypes.map((type) => (
                  <div
                    key={type.id}
                    className="border border-gray-200 p-4 hover:border-black transition-colors cursor-pointer group"
                    onClick={() => handleSelectType(type)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 font-['Roobert_Pro',sans-serif]">
                          {type.name}
                        </h3>
                        {type.description && (
                          <p className="text-sm text-gray-500 mt-1 font-['Roobert_Pro',sans-serif]">
                            {type.description}
                          </p>
                        )}
                        {type.duration_months && (
                          <p className="text-xs text-gray-400 mt-1 font-['Roobert_Pro',sans-serif]">
                            Διάρκεια: {type.duration_months} {type.duration_months === 1 ? 'μήνας' : 'μήνες'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-xl font-bold text-gray-900 font-['Roobert_Pro',sans-serif]">
                          €{type.price}
                        </span>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'email' && selectedType && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 p-3">
              <p className="text-sm text-gray-500 font-['Roobert_Pro',sans-serif]">Επιλεγμένη υπηρεσία</p>
              <p className="font-semibold text-gray-900 font-['Roobert_Pro',sans-serif]">
                {selectedType.name} — €{selectedType.price}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-email" className="font-['Roobert_Pro',sans-serif]">
                Email παραλήπτη
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="example@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="pl-10 rounded-none font-['Roobert_Pro',sans-serif]"
                />
              </div>
              <p className="text-xs text-gray-400 font-['Roobert_Pro',sans-serif]">
                Η δωροκάρτα θα αποσταλεί σε αυτό το email
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                className="rounded-none font-['Roobert_Pro',sans-serif]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Πίσω
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={!recipientEmail || purchasing}
                className="bg-black text-white hover:bg-gray-800 rounded-none font-['Roobert_Pro',sans-serif]"
              >
                {purchasing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Προχώρα στην πληρωμή
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
