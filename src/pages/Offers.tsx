import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tag, Check, X, ShoppingCart, RefreshCw, Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Offers() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [newOffers, setNewOffers] = useState<any[]>([]);
  const [readOffers, setReadOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOffer, setProcessingOffer] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const { userProfile } = useRoleCheck();
  const isMobile = useIsMobile();

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
        
        // Παίρνουμε τα acknowledged offer IDs από localStorage
        const acknowledgedIds = JSON.parse(localStorage.getItem('acknowledgedOffers') || '[]');
        const acknowledgedOfferIds = new Set(acknowledgedIds);

        // Διαχωρισμός προσφορών με βάση το αν έχουν επισημανθεί ως "ενημερώθηκα"
        const allOffers = acceptedOffers || [];
        const newOffersData = allOffers.filter(offer => 
          !acknowledgedOfferIds.has(offer.id)
        );
        const readOffersData = allOffers.filter(offer => 
          acknowledgedOfferIds.has(offer.id)
        );
        
        setNewOffers(newOffersData);
        setReadOffers(readOffersData);
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
        // Για χρήστες βάζουμε όλες τις προσφορές στο newOffers
        setNewOffers(availableOffers);
        setReadOffers([]);
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
          console.log('🔄 Reloading offers after free offer activation');
          loadUserOffers();
          return;
       }
      
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

  const handleMarkAsRead = async () => {
    setMarkingAsRead(true);
    
    try {
      // Παίρνουμε τα υπάρχοντα acknowledged offer IDs από localStorage
      const existingAcknowledged = JSON.parse(localStorage.getItem('acknowledgedOffers') || '[]');
      
      // Προσθέτουμε τα IDs των νέων αποδεκτών προσφορών
      const newOfferIds = newOffers.map(offer => offer.id);
      const updatedAcknowledged = [...existingAcknowledged, ...newOfferIds];
      
      // Αποθηκεύουμε στο localStorage
      localStorage.setItem('acknowledgedOffers', JSON.stringify(updatedAcknowledged));
      
      // Μεταφορά νέων προσφορών στο "Ενημερώθηκα"
      setReadOffers(prev => [...prev, ...newOffers]);
      setNewOffers([]);
      
      // Αλλάζουμε στο tab "Ενημερώθηκα"
      setActiveTab("read");
      
      // Στέλνουμε event για το sidebar
      window.dispatchEvent(new CustomEvent('offers-acknowledged'));
      
      toast.success('Όλες οι αποδεκτές προσφορές μεταφέρθηκαν στο "Ενημερώθηκα"');
    } catch (error) {
      console.error('Error marking offers as read:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    } finally {
      setMarkingAsRead(false);
    }
  };

  const renderOfferCard = (offer: any) => {
    return (
      <Card key={offer.id} className="rounded-none overflow-hidden border-l-4 border-l-[#00ffba] h-16">
        <CardContent className="p-3 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Left section - Offer info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Tag className="w-4 h-4 text-[#00ffba] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">
                    {userProfile?.role === 'admin' 
                      ? offer.subscription_types?.name 
                      : offer.name
                    }
                  </span>
                  <Badge className="bg-[#00ffba] text-black rounded-none text-xs px-1 py-0 flex-shrink-0">
                    {userProfile?.role === 'admin' ? 'ΑΠΟΔΕΚΤΗ' : 'ΠΡΟΣΦΟΡΑ'}
                  </Badge>
                </div>
                {userProfile?.role === 'admin' ? (
                  <p className="text-xs text-gray-600 truncate">{offer.app_users?.name}</p>
                ) : (
                  <p className="text-xs text-gray-600 truncate">
                    Έως {new Date(offer.end_date).toLocaleDateString('el-GR')}
                  </p>
                )}
              </div>
            </div>

            {/* Center section - Price */}
            <div className="text-center mx-4 flex-shrink-0">
              <div className="text-lg font-bold text-[#00ffba]">
                {offer.is_free ? 'ΔΩΡΕΑΝ' : `€${userProfile?.role === 'admin' ? offer.amount : offer.discounted_price}`}
              </div>
              {offer.subscription_types?.price && !offer.is_free && (
                <div className="text-xs text-gray-500 line-through">
                  €{offer.subscription_types.price}
                </div>
              )}
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {userProfile?.role === 'admin' ? (
                <Badge className={`rounded-none text-xs ${offer.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {offer.status === 'completed' ? 'Ολοκληρωμένη' : 'Εκκρεμής'}
                </Badge>
              ) : (
                <>
                  <Button
                    onClick={() => handleAcceptOffer(offer)}
                    disabled={processingOffer === offer.id}
                    size="sm"
                    className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none px-3 py-1 text-xs"
                  >
                    {processingOffer === offer.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black"></div>
                    ) : (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        {offer.is_free ? 'Ενεργοποίηση' : 'Αποδοχή'}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRejectOffer(offer)}
                    variant="outline"
                    size="sm"
                    className="rounded-none border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && showMobileSidebar && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="relative w-64 h-full">
              <Sidebar 
                isCollapsed={false} 
                setIsCollapsed={setIsCollapsed}
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Mobile Header */}
          {isMobile && (
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSidebar(true)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">
                {userProfile?.role === 'admin' ? 'Αποδεκτές Προσφορές' : 'Προσφορές'}
              </h1>
              <div className="w-9" />
            </div>
          )}

          <div className="p-4 md:p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
              <p className="mt-2 text-gray-600">Φορτώνω τις προσφορές...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={setIsCollapsed}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {userProfile?.role === 'admin' ? 'Αποδεκτές Προσφορές' : 'Προσφορές'}
            </h1>
            <div className="w-9" />
          </div>
        )}

        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {userProfile?.role === 'admin' ? 'Αποδεκτές Προσφορές' : 'Προσφορές'}
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  onClick={loadUserOffers}
                  variant="outline"
                  className="rounded-none"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Ανανέωση
                </Button>
                {userProfile?.role === 'admin' && newOffers.length > 0 && (
                  <Button
                    onClick={handleMarkAsRead}
                    disabled={markingAsRead}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-none"
                  >
                    {markingAsRead ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Επεξεργασία...
                      </>
                    ) : (
                      'Επισήμανση ως "Ενημερώθηκα"'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden mb-4 space-y-2">
              <Button
                onClick={loadUserOffers}
                variant="outline"
                className="w-full rounded-none"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ανανέωση
              </Button>
              {userProfile?.role === 'admin' && newOffers.length > 0 && (
                <Button
                  onClick={handleMarkAsRead}
                  disabled={markingAsRead}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none"
                  size="sm"
                >
                  {markingAsRead ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Επεξεργασία...
                    </>
                  ) : (
                    'Επισήμανση ως "Ενημερώθηκα"'
                  )}
                </Button>
              )}
            </div>

            {userProfile?.role === 'admin' ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none">
                  <TabsTrigger value="new" className="rounded-none text-sm">
                    Νέες ({newOffers.length})
                  </TabsTrigger>
                  <TabsTrigger value="read" className="rounded-none text-sm">
                    Ενημερώθηκα ({readOffers.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="new" className="space-y-2 mt-4">
                  {newOffers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                      <p className="text-sm">Δεν υπάρχουν νέες αποδεκτές προσφορές</p>
                    </div>
                  ) : (
                    newOffers.map(renderOfferCard)
                  )}
                </TabsContent>
                
                <TabsContent value="read" className="space-y-2 mt-4">
                  {readOffers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                      <p className="text-sm">Δεν έχετε επισημάνει κάποιες προσφορές ως "Ενημερώθηκα"</p>
                    </div>
                  ) : (
                    readOffers.map(renderOfferCard)
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-2">
                {newOffers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                    <p className="text-sm">Δεν υπάρχουν διαθέσιμες προσφορές</p>
                  </div>
                ) : (
                  newOffers.map(renderOfferCard)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}