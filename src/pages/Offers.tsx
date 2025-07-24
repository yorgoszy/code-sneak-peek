import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tag, Check, X, ShoppingCart } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";

export default function Offers() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOffer, setProcessingOffer] = useState<string | null>(null);
  const { userProfile } = useRoleCheck();

  useEffect(() => {
    if (userProfile?.id) {
      loadUserOffers();
    }
  }, [userProfile?.id]);

  const loadUserOffers = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    try {
      console.log('🔄 Loading offers for user:', userProfile.id, 'Role:', userProfile.role);
      
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          subscription_types(name, description, price)
        `)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('start_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('❌ Error loading offers:', error);
        throw error;
      }
      
      console.log('✅ All active offers:', data);
      
      let userOffers = data || [];
      
      // Αν δεν είναι admin, φιλτράρισμα προσφορών βάσει visibility
      if (userProfile.role !== 'admin') {
        userOffers = data?.filter(offer => {
          if (offer.visibility === 'all') return true;
          if (offer.visibility === 'individual' || offer.visibility === 'selected') {
            return offer.target_users?.includes(userProfile.id);
          }
          return false;
        }) || [];
      }
      
      console.log('✅ User specific offers:', userOffers);
      setOffers(userOffers);
    } catch (error) {
      console.error('💥 Error loading offers:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των προσφορών');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: any) => {
    setProcessingOffer(offer.id);
    try {
      console.log('✅ Accepting offer:', offer.name);
      
      // Δημιουργία Stripe checkout session για την προσφορά
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          subscription_type_id: offer.subscription_type_id,
          discounted_price: offer.discounted_price,
          offer_id: offer.id
        }
      });

      if (error) {
        console.error('❌ Error creating checkout:', error);
        throw error;
      }

      if (data?.url) {
        console.log('✅ Redirecting to Stripe checkout:', data.url);
        // Άνοιγμα σε νέο tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('Δεν βρέθηκε URL για τη σελίδα πληρωμής');
      }
    } catch (error) {
      console.error('💥 Error accepting offer:', error);
      toast.error('Σφάλμα κατά την αποδοχή της προσφοράς');
    } finally {
      setProcessingOffer(null);
    }
  };

  const handleRejectOffer = async (offer: any) => {
    console.log('❌ Rejecting offer:', offer.name);
    toast.info(`Απορρίψατε την προσφορά: ${offer.name}`);
    // Μπορείς να προσθέσεις λογική για καταγραφή απόρριψης αν χρειάζεται
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex-1 p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω τις προσφορές...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#00ffba]" />
            Διαθέσιμες Προσφορές
          </h1>
          <p className="text-gray-600">Δείτε και αποδεχτείτε τις ειδικές προσφορές που είναι διαθέσιμες για εσάς</p>
        </div>
        
        {offers.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="p-8 text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Δεν υπάρχουν διαθέσιμες προσφορές</h3>
              <p className="text-gray-600 mb-4">Δεν υπάρχουν ενεργές προσφορές για εσάς αυτή τη στιγμή.</p>
              <Button 
                onClick={() => window.location.href = '/dashboard/shop'}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Δείτε τις Αγορές
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {offers.map((offer) => (
              <Card key={offer.id} className="rounded-none overflow-hidden border-l-4 border-l-[#00ffba]">
                <CardHeader className="bg-gradient-to-r from-[#00ffba]/10 to-transparent">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-[#00ffba]" />
                      <span className="text-xl">{offer.name}</span>
                      <Badge className="bg-[#00ffba] text-black rounded-none">
                        ΕΙΔΙΚΗ ΠΡΟΣΦΟΡΑ
                      </Badge>
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Περιγραφή Προσφοράς</h4>
                      {offer.description && (
                        <p className="text-gray-600 mb-4">{offer.description}</p>
                      )}
                      
                      <h4 className="font-semibold text-gray-900 mb-2">Τύπος Συνδρομής</h4>
                      <p className="text-gray-800 font-medium">{offer.subscription_types?.name}</p>
                      {offer.subscription_types?.description && (
                        <p className="text-gray-600 text-sm mt-1">{offer.subscription_types.description}</p>
                      )}
                      
                      <div className="mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span><strong>Έναρξη:</strong> {new Date(offer.start_date).toLocaleDateString('el-GR')}</span>
                          <span><strong>Λήξη:</strong> {new Date(offer.end_date).toLocaleDateString('el-GR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <div className="bg-gray-50 rounded-none p-4 mb-4">
                        <h5 className="font-semibold text-gray-900 mb-2">Εξοικονόμηση</h5>
                        {offer.subscription_types?.price && (
                          <div className="text-2xl font-bold text-green-600">
                            €{(offer.subscription_types.price - offer.discounted_price).toFixed(2)}
                          </div>
                        )}
                        <p className="text-sm text-gray-600">από την κανονική τιμή</p>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAcceptOffer(offer)}
                          disabled={processingOffer === offer.id}
                          className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                        >
                          {processingOffer === offer.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                              Επεξεργασία...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Αποδοχή
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleRejectOffer(offer)}
                          variant="outline"
                          className="flex-1 rounded-none border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Απόρριψη
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}