import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Tag, Calendar, Euro, ShoppingCart, X, Plus, Gift } from "lucide-react";
import { toast } from "sonner";
import { MagicBoxGameV2 } from "@/components/magic-boxes/MagicBoxGameV2";
import { ProgramCalendarDialog } from "@/components/programs/ProgramCalendarDialog";
import { useProgramCalendarDialog } from "@/hooks/useProgramCalendarDialog";

interface UserProfileOffersProps {
  userProfile: any;
  onOfferRejected?: () => void;
}

export const UserProfileOffers: React.FC<UserProfileOffersProps> = ({ userProfile, onOfferRejected }) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOffer, setProcessingOffer] = useState<string | null>(null);
  
  const {
    isOpen: showProgramCalendar,
    programId,
    checkAndShowProgramCalendar,
    close: closeProgramCalendar
  } = useProgramCalendarDialog();

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

      // Φόρτωση αποδεκτών προσφορών (από payments)
      const { data: acceptedOffers, error: acceptedError } = await supabase
        .from('payments')
        .select('offer_id')
        .eq('user_id', userProfile.id)
        .not('offer_id', 'is', null);

      if (acceptedError) throw acceptedError;

      const rejectedOfferIds = new Set(rejectedOffers?.map(r => r.offer_id) || []);
      const acceptedOfferIds = new Set(acceptedOffers?.map(p => p.offer_id) || []);
      
      // Φιλτράρισμα προσφορών βάσει visibility, απόρριψης και αποδοχής
      const filteredOffers = offers?.filter(offer => {
        // Αποκλεισμός απορριμμένων και αποδεκτών προσφορών
        if (rejectedOfferIds.has(offer.id) || acceptedOfferIds.has(offer.id)) return false;
        
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
      console.log('✅ Accepting offer:', offer.name, 'is_free:', offer.is_free);
      
      // Αν είναι δωρεάν προσφορά, ενημέρωση απευθείας του προφίλ
      if (offer.is_free) {
        console.log('✅ Processing free offer directly');
        
        // Δημιουργία payment record για τη δωρεάν προσφορά
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            user_id: userProfile.id,
            subscription_type_id: offer.subscription_type_id,
            amount: 0,
            status: 'completed',
            payment_method: 'free_offer',
            payment_date: new Date().toISOString(),
            offer_id: offer.id
          });

        if (paymentError) {
          console.error('❌ Error processing free offer payment:', paymentError);
          throw paymentError;
        }

        // Δημιουργία απόδειξης για τη δωρεάν προσφορά
        const receiptNumber = `FREE-${Date.now()}`;
        const { error: receiptError } = await supabase
          .from('receipts')
          .insert({
            receipt_number: receiptNumber,
            customer_name: userProfile.name || 'Χρήστης',
            customer_email: userProfile.email || '',
            items: [{
              name: offer.subscription_types.name,
              quantity: 1,
              unit_price: 0,
              total: 0
            }],
            subtotal: 0,
            vat: 0,
            total: 0,
            issue_date: new Date().toISOString().split('T')[0],
            mydata_status: 'not_required'
          });

        if (receiptError) {
          console.error('❌ Error creating receipt for free offer:', receiptError);
          // Δεν σταματάμε τη διαδικασία αν η απόδειξη αποτύχει
        }

        toast.success(`Η δωρεάν προσφορά "${offer.name}" ενεργοποιήθηκε!`);
        
        // Ανανέωση των προσφορών και ενημέρωση του sidebar
        loadUserOffers();
        onOfferRejected?.(); // Ανανέωση του sidebar
        
        // Έλεγχος αν είναι συνδρομή με πρόγραμμα μετά την ανανέωση
        const hasProgram = await checkAndShowProgramCalendar(offer.subscription_type_id);
        if (!hasProgram) {
          console.log('✅ Offer processed successfully - no program calendar needed');
        }
        return;
      }

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
        // Ανανέωση του sidebar πριν την ανακατεύθυνση
        onOfferRejected?.();
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

  return (
    <div className="space-y-6">
      {/* Magic Box Section */}
      <div className="mb-6">
        <MagicBoxGameV2 />
      </div>
      
      {offers.length === 0 ? (
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
      ) : (
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
                      {offer.is_free ? 'ΔΩΡΕΑΝ' : `€${offer.discounted_price}`}
                    </div>
                    {offer.subscription_types?.price && !offer.is_free && (
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
                   {offer.is_free ? (
                     <div className="flex items-center gap-1">
                       <Gift className="h-4 w-4" />
                       <span>Δωρεάν προσφορά</span>
                     </div>
                   ) : offer.subscription_types?.price ? (
                     <div className="flex items-center gap-1">
                       <Euro className="h-4 w-4" />
                       <span>Εξοικονόμηση: €{(offer.subscription_types.price - offer.discounted_price).toFixed(2)}</span>
                     </div>
                   ) : null}
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
                    {processingOffer === offer.id ? 'Επεξεργασία...' : (offer.is_free ? 'Ενεργοποίηση' : 'Αποδοχή')}
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
      )}

      <ProgramCalendarDialog
        isOpen={showProgramCalendar}
        onClose={closeProgramCalendar}
        programId={programId}
        onComplete={() => {
          loadUserOffers();
          onOfferRejected?.(); // Ενημέρωση του sidebar και μετά το κλείσιμο του calendar
        }}
      />
    </div>
  );
};