import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Clock, MapPin, Calendar, Dumbbell, Video, CheckCircle } from "lucide-react";

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  subscription_mode: 'time_based' | 'visit_based' | 'videocall';
  visit_count?: number;
  visit_expiry_months?: number;
  is_active: boolean;
  available_in_shop?: boolean;
  coach_shop_only?: boolean;
}

const CoachShopContent = () => {
  const { coachId } = useCoachContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  useEffect(() => {
    if (coachId) {
      fetchProducts();
    }
  }, [coachId]);

  // Handle payment success callback
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (payment === 'success' && sessionId) {
      console.log('🎉 Payment successful, processing...', sessionId);
      handlePaymentSuccess(sessionId);
    } else if (payment === 'cancelled') {
      toast.error('Η πληρωμή ακυρώθηκε');
      // Clean up URL params
      searchParams.delete('payment');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      // Call the process-payment-success function to complete the payment
      const { data, error } = await supabase.functions.invoke('process-payment-success', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      console.log('✅ Payment processed:', data);
      setPaymentSuccess(true);
      toast.success('Η πληρωμή ολοκληρώθηκε επιτυχώς! Το προφίλ σας έχει ενεργοποιηθεί.');
      
      // Clean up URL params
      searchParams.delete('payment');
      searchParams.delete('session_id');
      setSearchParams(searchParams);

      // Reload the page to refresh subscription status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Σφάλμα ολοκλήρωσης πληρωμής');
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch products that are active and coach_shop_only = true
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, description, price, duration_months, subscription_mode, visit_count, visit_expiry_months, is_active, available_in_shop, coach_shop_only')
        .eq('is_active', true)
        .eq('coach_shop_only', true)
        .order('price');

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        ...item,
        subscription_mode: (item.subscription_mode || 'time_based') as 'time_based' | 'visit_based' | 'videocall',
        available_in_shop: item.available_in_shop || false,
        coach_shop_only: item.coach_shop_only || false
      })) as SubscriptionType[];

      setProducts(typedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Σφάλμα φόρτωσης προϊόντων');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: SubscriptionType) => {
    setPurchasing(product.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: product.price,
          currency: "eur",
          productName: product.name,
          subscriptionTypeId: product.id,
          isCoachShop: true
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast.info('Το Stripe checkout άνοιξε σε νέα καρτέλα');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Σφάλμα δημιουργίας πληρωμής');
    }
    
    // Always reset purchasing state after a short delay (to show feedback)
    setTimeout(() => {
      setPurchasing(null);
    }, 1000);
  };
  
  if (!coachId) return null;

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Φόρτωση προϊόντων...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Διαθέσιμα Πακέτα</h2>
        <p className="text-muted-foreground">Επιλέξτε το πακέτο που σας ταιριάζει</p>
      </div>

      {products.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν διαθέσιμα προϊόντα</h3>
            <p>Τα προϊόντα θα εμφανιστούν εδώ όταν γίνουν διαθέσιμα.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="rounded-none hover:shadow-lg transition-all duration-200 flex flex-col h-[400px]">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center items-center mb-4">
                  {product.subscription_mode === 'visit_based' ? (
                    <div className="bg-blue-100 p-3 rounded-full">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                  ) : product.subscription_mode === 'videocall' ? (
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Video className="w-6 h-6 text-purple-600" />
                    </div>
                  ) : (
                    <div className="bg-green-100 p-3 rounded-full">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl font-bold">{product.name}</CardTitle>
                <div className="text-3xl font-bold text-[#cb8954]">
                  €{product.price}
                  {product.subscription_mode === 'time_based' && (
                    <span className="text-sm text-muted-foreground font-normal">/μήνα</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-3 mb-6 flex-1">
                  {product.subscription_mode === 'visit_based' ? (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="flex items-center text-sm">
                          <Dumbbell className="w-4 h-4 mr-2 text-blue-500" />
                          Επισκέψεις
                        </span>
                        <Badge variant="secondary" className="rounded-none">
                          {product.visit_count}
                        </Badge>
                      </div>
                      {product.visit_expiry_months && (
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="flex items-center text-sm">
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            Λήξη σε
                          </span>
                          <Badge variant="secondary" className="rounded-none">
                            {product.visit_expiry_months} μήνες
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : product.subscription_mode === 'videocall' ? (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="flex items-center text-sm">
                          <Video className="w-4 h-4 mr-2 text-purple-500" />
                          Κλήσεις
                        </span>
                        <Badge variant="secondary" className="rounded-none">
                          {product.visit_count}
                        </Badge>
                      </div>
                      {product.visit_expiry_months && (
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="flex items-center text-sm">
                            <Clock className="w-4 h-4 mr-2 text-purple-500" />
                            Λήξη σε
                          </span>
                          <Badge variant="secondary" className="rounded-none">
                            {product.visit_expiry_months} μήνες
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-green-500" />
                        Διάρκεια
                      </span>
                      <Badge variant="secondary" className="rounded-none">
                        {product.duration_months} μήνες
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <Button 
                    onClick={() => handlePurchase(product)}
                    disabled={purchasing === product.id}
                    className="w-full bg-[#cb8954] hover:bg-[#cb8954]/90 text-white rounded-none"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {purchasing === product.id ? 'Επεξεργασία...' : 'Αγορά'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const CoachShop = () => {
  return (
    <CoachLayout title="Shop" ContentComponent={CoachShopContent} />
  );
};

export default CoachShop;
