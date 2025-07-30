import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Offer {
  id: string;
  name: string;
  description: string;
  discounted_price: number;
  is_free: boolean;
  subscription_types: {
    name: string;
    price: number;
  };
}

interface ConsolationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsolationDialog: React.FC<ConsolationDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMagicBoxOffers();
    }
  }, [isOpen]);

  const fetchMagicBoxOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          id,
          name,
          description,
          discounted_price,
          is_free,
          subscription_types!inner(
            name,
            price
          )
        `)
        .eq('visibility', 'magic_box_losers')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) return;

      const { error } = await supabase
        .from('offer_responses')
        .insert({
          offer_id: offerId,
          user_id: userData.id,
          response: 'accepted'
        });

      if (error) throw error;

      toast.success('Η προσφορά έγινε δεκτή! Θα επικοινωνήσουμε μαζί σας σύντομα.');
      onClose();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Σφάλμα κατά την αποδοχή της προσφοράς');
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-none bg-white shadow-2xl border-0">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-[#00ffba]" />
            Δωρεάν Επίσκεψη!
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 text-base leading-relaxed">
              Λυπούμαστε που δεν κερδίσατε σήμερα, αλλά δεν φεύγετε με άδεια χέρια! 
              Σας προσφέρουμε μία δωρεάν επίσκεψη στο γυμναστήριό μας ως ένδειξη εκτίμησης.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Φόρτωση προσφορών...</p>
            </div>
          ) : offers.length > 0 ? (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 justify-center">
                <Tag className="w-5 h-5 text-[#00ffba]" />
                <h3 className="font-semibold text-gray-800">Ειδικές Προσφορές για Εσάς!</h3>
              </div>
              
              {offers.map((offer) => (
                <Card key={offer.id} className="rounded-none border-[#00ffba]/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{offer.name}</h4>
                        {offer.description && (
                          <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{offer.subscription_types.name}</span>
                          <div className="flex items-center gap-1">
                            {offer.is_free ? (
                              <Badge className="bg-[#00ffba] text-black">ΔΩΡΕΑΝ</Badge>
                            ) : (
                              <>
                                <span className="text-lg font-bold text-[#00ffba]">€{offer.discounted_price}</span>
                                <span className="text-sm text-gray-500 line-through">€{offer.subscription_types.price}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAcceptOffer(offer.id)}
                        className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black font-medium"
                        size="sm"
                      >
                        Αποδοχή
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center mb-6">
              <p className="text-gray-600">
                Κάντε booking την ώρα της επιλογής σας και ανακαλύψτε όλες τις υπηρεσίες μας!
              </p>
            </div>
          )}
          
          <div className="text-center">
            <Button 
              onClick={onClose}
              variant="outline"
              className="rounded-none px-8 py-3 border-[#00ffba] text-[#00ffba] hover:bg-[#00ffba]/10"
            >
              Κλείσιμο
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};