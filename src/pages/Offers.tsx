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
      
      // Για admin, φορτώνουμε τις αποδεκτές προσφορές από τις πληρωμές
      if (userProfile.role === 'admin') {
        const { data: acceptedOffers, error } = await supabase
          .from('payments')
          .select(`
            *,
            app_users!payments_user_id_fkey(id, name, email),
            subscription_types!payments_subscription_type_id_fkey(name, description, price)
          `)
          .not('subscription_type_id', 'is', null)
          .order('payment_date', { ascending: false });

        if (error) {
          console.error('❌ Error loading accepted offers:', error);
          throw error;
        }
        
        console.log('✅ Accepted offers for admin:', acceptedOffers);
        setOffers(acceptedOffers || []);
      } else {
        // Για χρήστες, φορτώνουμε τις διαθέσιμες προσφορές
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
        
        // Φιλτράρισμα προσφορών βάσει visibility
        const userOffers = data?.filter(offer => {
          if (offer.visibility === 'all') return true;
          if (offer.visibility === 'individual' || offer.visibility === 'selected') {
            return offer.target_users?.includes(userProfile.id);
          }
          return false;
        }) || [];
        
        // Φιλτράρισμα απορριμμένων προσφορών
        const { data: rejectedOffers } = await supabase
          .from('offer_rejections')
          .select('offer_id')
          .eq('user_id', userProfile.id);
        
        const rejectedOfferIds = new Set(rejectedOffers?.map(r => r.offer_id) || []);
        const availableOffers = userOffers.filter(offer => !rejectedOfferIds.has(offer.id));
        
        console.log('✅ User specific offers:', availableOffers);
        setOffers(availableOffers);
      }
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
    try {
      console.log('❌ Rejecting offer:', offer.name);
      
      // Καταγραφή απόρριψης στη βάση δεδομένων
      const { error } = await supabase
        .from('offer_rejections')
        .insert({
          user_id: userProfile.id,
          offer_id: offer.id
        });

      if (error) {
        console.error('❌ Error rejecting offer:', error);
        throw error;
      }

      toast.success(`Απορρίψατε την προσφορά: ${offer.name}`);
      
      // Ανανέωση της λίστας
      loadUserOffers();
    } catch (error) {
      console.error('💥 Error rejecting offer:', error);
      toast.error('Σφάλμα κατά την απόρριψη της προσφοράς');
    }
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
            {userProfile?.role === 'admin' ? 'Αποδεκτές Προσφορές' : 'Διαθέσιμες Προσφορές'}
          </h1>
          <p className="text-gray-600">
            {userProfile?.role === 'admin' 
              ? 'Προβολή όλων των προσφορών που έχουν αποδεχθεί οι χρήστες'
              : 'Δείτε και αποδεχτείτε τις ειδικές προσφορές που είναι διαθέσιμες για εσάς'
            }
          </p>
        </div>
        
        {offers.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="p-8 text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {userProfile?.role === 'admin' 
                  ? 'Δεν υπάρχουν αποδεκτές προσφορές' 
                  : 'Δεν υπάρχουν διαθέσιμες προσφορές'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {userProfile?.role === 'admin'
                  ? 'Δεν έχει γίνει αποδοχή προσφορών από χρήστες ακόμα.'
                  : 'Δεν υπάρχουν ενεργές προσφορές για εσάς αυτή τη στιγμή.'
                }
              </p>
              {userProfile?.role !== 'admin' && (
                <Button 
                  onClick={() => window.location.href = '/dashboard/shop'}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Δείτε τις Αγορές
                </Button>
              )}
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
                      <span className="text-xl">
                        {userProfile?.role === 'admin' 
                          ? offer.subscription_types?.name 
                          : offer.name
                        }
                      </span>
                      <Badge className="bg-[#00ffba] text-black rounded-none">
                        {userProfile?.role === 'admin' ? 'ΑΠΟΔΕΚΤΗ' : 'ΕΙΔΙΚΗ ΠΡΟΣΦΟΡΑ'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#00ffba]">
                        €{userProfile?.role === 'admin' ? offer.amount : offer.discounted_price}
                      </div>
                      {userProfile?.role === 'admin' && offer.subscription_types?.price && (
                        <div className="text-sm text-gray-500 line-through">
                          €{offer.subscription_types.price}
                        </div>
                      )}
                      {userProfile?.role !== 'admin' && offer.subscription_types?.price && (
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
                      {userProfile?.role === 'admin' ? (
                        <>
                          <h4 className="font-semibold text-gray-900 mb-2">Στοιχεία Χρήστη</h4>
                          <p className="text-gray-800 font-medium">{offer.app_users?.name}</p>
                          <p className="text-gray-600 text-sm">{offer.app_users?.email}</p>
                          
                          <h4 className="font-semibold text-gray-900 mb-2 mt-4">Τύπος Συνδρομής</h4>
                          <p className="text-gray-800 font-medium">{offer.subscription_types?.name}</p>
                          {offer.subscription_types?.description && (
                            <p className="text-gray-600 text-sm mt-1">{offer.subscription_types.description}</p>
                          )}
                          
                          <div className="mt-4 text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <span><strong>Ημερομηνία Αποδοχής:</strong> {new Date(offer.payment_date).toLocaleDateString('el-GR')}</span>
                              <span><strong>Κατάσταση:</strong> {offer.status === 'completed' ? 'Ολοκληρωμένη' : 'Εκκρεμής'}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      {userProfile?.role === 'admin' ? (
                        <div className="bg-gray-50 rounded-none p-4">
                          <h5 className="font-semibold text-gray-900 mb-2">Λεπτομέρειες Πληρωμής</h5>
                          <div className="space-y-2 text-sm">
                            <div><strong>Αναγνωριστικό:</strong> {offer.transaction_id || 'N/A'}</div>
                            <div><strong>Μέθοδος:</strong> {offer.payment_method || 'N/A'}</div>
                            {offer.last_four && (
                              <div><strong>Κάρτα:</strong> ****{offer.last_four}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
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