import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Tag, Calendar, Euro, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

interface UserProfileOffersProps {
  userProfile: any;
  onOfferRejected?: () => void;
}

export const UserProfileOffers: React.FC<UserProfileOffersProps> = ({ userProfile, onOfferRejected }) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOffer, setProcessingOffer] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.id) {
      loadUserOffers();
    }
  }, [userProfile?.id]);

  const loadUserOffers = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    try {
      // Φόρτωση προσφορών
      const { data: offers, error } = await supabase
        .from('offers')
        .select(`
          *,
          subscription_types(name, description, price)
        `)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('start_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      // Φόρτωση απορριμμένων προσφορών
      const { data: rejectedOffers, error: rejectedError } = await supabase
        .from('offer_rejections')
        .select('offer_id')
        .eq('user_id', userProfile.id);

      if (rejectedError) throw rejectedError;

      const rejectedOfferIds = new Set(rejectedOffers?.map(r => r.offer_id) || []);
      
      // Φιλτράρισμα προσφορών βάσει visibility και απόρριψης
      const filteredOffers = offers?.filter(offer => {
        // Αποκλεισμός απορριμμένων προσφορών
        if (rejectedOfferIds.has(offer.id)) return false;
        
        if (offer.visibility === 'all') return true;
        if (offer.visibility === 'individual' || offer.visibility === 'selected') {
          return offer.target_users?.includes(userProfile.id);
        }
        return false;
      }) || [];
      
      setOffers(filteredOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: any) => {
    if (!offer?.subscription_types) {
      toast.error('Λάθος δεδομένα προσφοράς');
      return;
    }

    setProcessingOffer(offer.id);
    try {
      // Πάρε το auth token για authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Πρέπει να είστε συνδεδεμένοι');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          offer_id: offer.id,
          subscription_type_id: offer.subscription_type_id,
          discounted_price: offer.discounted_price,
          isOffer: true
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Δεν ελήφθη URL checkout');
      }
    } catch (error) {
      console.error('Error processing offer:', error);
      toast.error('Σφάλμα κατά την επεξεργασία της προσφοράς');
    } finally {
      setProcessingOffer(null);
    }
  };

  const handleRejectOffer = async (offer: any) => {
    try {
      const { error } = await supabase
        .from('offer_rejections')
        .insert({
          user_id: userProfile.id,
          offer_id: offer.id
        });

      if (error) throw error;

      console.log('Απορρίφθηκε η προσφορά:', offer.name);
      toast.success('Η προσφορά απορρίφθηκε');
      
      // Ανανέωση των προσφορών για να αφαιρεθεί η απορριφθείσα
      loadUserOffers();
      
      // Ενημέρωση του sidebar για τον αριθμό προσφορών
      onOfferRejected?.();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast.error('Σφάλμα κατά την απόρριψη της προσφοράς');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Φόρτωση προσφορών...</span>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="text-center py-8">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Δεν υπάρχουν διαθέσιμες προσφορές
          </h3>
          <p className="text-gray-500 mb-4">
            Προς το παρόν δεν υπάρχουν ενεργές προσφορές για εσάς.
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard/shop'} 
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Δείτε το Κατάστημα
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {offers.map((offer) => (
          <Card key={offer.id} className="rounded-none border-l-4 border-l-[#00ffba]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900 mb-2">
                    {offer.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-none bg-[#00ffba]/10 text-[#00ffba]">
                      Ειδική Προσφορά
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#00ffba]">
                    €{offer.discounted_price}
                  </div>
                  {offer.subscription_types?.price && (
                    <div className="text-sm text-gray-500 line-through">
                      €{offer.subscription_types.price}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {offer.description && (
                <p className="text-gray-600">{offer.description}</p>
              )}

              {offer.subscription_types && (
                <div className="bg-gray-50 p-4 rounded-none">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {offer.subscription_types.name}
                  </h4>
                  {offer.subscription_types.description && (
                    <p className="text-sm text-gray-600">
                      {offer.subscription_types.description}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Ισχύει έως: {new Date(offer.end_date).toLocaleDateString('el-GR')}</span>
                </div>
                {offer.subscription_types?.price && (
                  <div className="flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    <span>Εξοικονόμηση: €{(offer.subscription_types.price - offer.discounted_price).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={() => handleAcceptOffer(offer)}
                  disabled={processingOffer === offer.id}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none flex-1"
                >
                  {processingOffer === offer.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 mr-2" />
                  )}
                  {processingOffer === offer.id ? 'Επεξεργασία...' : 'Αποδοχή'}
                </Button>
                <Button
                  onClick={() => handleRejectOffer(offer)}
                  variant="outline"
                  className="rounded-none"
                  disabled={processingOffer === offer.id}
                >
                  <X className="w-4 h-4 mr-2" />
                  Απόρριψη
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};