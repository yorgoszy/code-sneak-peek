import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, ArrowRight, ArrowLeft, Loader2, Mail, Plus, Minus, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number | null;
  visit_count: number | null;
  subscription_mode: string | null;
}

interface CartItem {
  type: SubscriptionType;
  quantity: number;
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
  const [cart, setCart] = useState<Record<string, number>>({});
  const [recipientEmail, setRecipientEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionTypes();
      setStep('select');
      setCart({});
      setRecipientEmail('');
    }
  }, [isOpen]);

  const fetchSubscriptionTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, description, price, duration_months, visit_count, subscription_mode')
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

  const getQuantity = (typeId: string) => cart[typeId] || 0;

  const updateQuantity = (typeId: string, delta: number) => {
    setCart(prev => {
      const current = prev[typeId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [typeId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [typeId]: next };
    });
  };

  const getCartItems = (): CartItem[] => {
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantity]) => ({
        type: subscriptionTypes.find(t => t.id === id)!,
        quantity
      }))
      .filter(item => item.type);
  };

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = getCartItems().reduce((sum, item) => sum + item.type.price * item.quantity, 0);

  const handleProceed = () => {
    if (totalItems === 0) {
      toast.error('Επιλέξτε τουλάχιστον μία συνδρομή');
      return;
    }
    setStep('email');
  };

  const handlePurchase = async () => {
    if (totalItems === 0 || !recipientEmail) return;

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

      const items = getCartItems().map(item => ({
        subscription_type_id: item.type.id,
        subscription_type_name: item.type.name,
        amount: item.type.price,
        quantity: item.quantity
      }));

      const { data, error } = await supabase.functions.invoke('create-gift-card-checkout', {
        body: {
          items,
          recipient_email: recipientEmail,
          // Backward compatibility for single item
          subscription_type_id: items[0]?.subscription_type_id,
          subscription_type_name: items[0]?.subscription_type_name,
          amount: totalPrice
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
            {step === 'select' ? 'Επιλέξτε συνδρομές Gift Card' : 'Στοιχεία παραλήπτη'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : subscriptionTypes.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm font-['Roobert_Pro',sans-serif]">
                Δεν υπάρχουν διαθέσιμες συνδρομές
              </div>
            ) : (
              <div className="space-y-1">
                {subscriptionTypes.map((type) => {
                  const qty = getQuantity(type.id);
                  const isSelected = qty > 0;

                  return (
                    <div
                      key={type.id}
                      className={`border px-3 py-2 transition-colors flex items-center justify-between ${
                        isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-gray-900 font-['Roobert_Pro',sans-serif]">
                            {type.name}
                          </h3>
                          {type.description && (
                             <span className="text-xs text-gray-400 font-['Roobert_Pro',sans-serif]">
                               {type.description}
                             </span>
                           )}
                         </div>
                         {type.duration_months && (
                           <p className="text-xs text-gray-500 font-['Roobert_Pro',sans-serif]">
                             Διάρκεια: {type.duration_months} {type.duration_months === 1 ? 'μήνας' : 'μήνες'}
                           </p>
                         )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-sm font-bold text-gray-900 font-['Roobert_Pro',sans-serif]">
                          €{type.price}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-none"
                            onClick={() => updateQuantity(type.id, -1)}
                            disabled={qty === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-semibold text-xs font-['Roobert_Pro',sans-serif]">
                            {qty}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-none"
                            onClick={() => updateQuantity(type.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cart summary */}
            {totalItems > 0 && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-['Roobert_Pro',sans-serif]">
                    <ShoppingBag className="h-4 w-4" />
                    <span>{totalItems} {totalItems === 1 ? 'συνδρομή' : 'συνδρομές'}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 font-['Roobert_Pro',sans-serif]">
                    Σύνολο: €{totalPrice}
                  </span>
                </div>
                <Button
                  onClick={handleProceed}
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-none font-['Roobert_Pro',sans-serif]"
                >
                  Συνέχεια
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}

        {step === 'email' && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 p-3 space-y-2">
              <p className="text-sm text-gray-500 font-['Roobert_Pro',sans-serif]">Επιλεγμένες συνδρομές</p>
              {getCartItems().map(item => (
                <div key={item.type.id} className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm font-['Roobert_Pro',sans-serif]">
                    {item.type.name} × {item.quantity}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 font-['Roobert_Pro',sans-serif]">
                    €{item.type.price * item.quantity}
                  </p>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-2 flex items-center justify-between">
                <p className="font-bold text-gray-900 text-sm font-['Roobert_Pro',sans-serif]">Σύνολο</p>
                <p className="font-bold text-gray-900 font-['Roobert_Pro',sans-serif]">€{totalPrice}</p>
              </div>
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
                Οι δωροκάρτες θα αποσταλούν σε αυτό το email
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
