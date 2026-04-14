import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, ArrowRight, Loader2 } from "lucide-react";
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
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionTypes();
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

  const handlePurchase = async (subscriptionType: SubscriptionType) => {
    setPurchasing(subscriptionType.id);
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
          subscription_type_id: subscriptionType.id,
          subscription_type_name: subscriptionType.name,
          amount: subscriptionType.price
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Σφάλμα δημιουργίας πληρωμής');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-['Roobert_Pro',sans-serif]">
            <Gift className="h-5 w-5" />
            Επιλέξτε υπηρεσία Gift Card
          </DialogTitle>
        </DialogHeader>

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
                onClick={() => !purchasing && handlePurchase(type)}
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
                    {purchasing === type.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
