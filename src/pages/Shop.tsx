import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, Users, MapPin, Calendar, Dumbbell, ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { ShopProgramsSection } from "@/components/user-profile/shop/ShopProgramsSection";

interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  subscription_mode: 'time_based' | 'visit_based';
  visit_count?: number;
  visit_expiry_months?: number;
  is_active: boolean;
  available_in_shop?: boolean;
}

interface ShopProps {
  userProfile?: any;
  userEmail?: string;
  onSignOut?: () => void;
}

const Shop = ({ userProfile, userEmail, onSignOut }: ShopProps = {}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [products, setProducts] = useState<SubscriptionType[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useRoleCheck();

  useEffect(() => {
    fetchProducts();
    
    // Handle payment success for program purchases
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      processProgramPayment(sessionId);
    } else if (paymentStatus === 'cancelled') {
      toast.info('Η πληρωμή ακυρώθηκε');
      // Clear search params
      setSearchParams({});
    }
  }, []);

  const processProgramPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-program-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Η αγορά ολοκληρώθηκε! Το πρόγραμμα ανατέθηκε στο προφίλ σου.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Σφάλμα κατά την επεξεργασία της πληρωμής');
    } finally {
      // Clear search params
      setSearchParams({});
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, description, price, duration_months, subscription_mode, visit_count, visit_expiry_months, is_active, available_in_shop')
        .eq('is_active', true)
        .eq('available_in_shop', true)
        .order('price');

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        ...item,
        subscription_mode: (item.subscription_mode || 'time_based') as 'time_based' | 'visit_based',
        available_in_shop: item.available_in_shop || false
      })) as SubscriptionType[];

      setProducts(typedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των προϊόντων');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePurchase = async (product: SubscriptionType) => {
    setLoading(product.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: product.price,
          currency: "eur",
          productName: product.name
        }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Σφάλμα κατά τη δημιουργία πληρωμής');
    } finally {
      setLoading(null);
    }
  };

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
          <p className="mt-2 text-gray-600">Φορτώνω τα προϊόντα...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button for Mobile/Tablet */}
        <div className="md:hidden mb-4">
          <Button
            onClick={() => navigate(userId ? `/dashboard/user-profile/${userId}` : `/dashboard/user-profile`)}
            variant="ghost"
            className="flex items-center text-gray-600 hover:text-gray-900 p-0 h-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή στους Χρήστες
          </Button>
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Αγορές</h1>
            <p className="text-lg text-gray-600">
              Αγόρασε πακέτα επισκέψεων, συνδρομές και άλλες υπηρεσίες
            </p>
          </div>
          
          {userProfile && onSignOut && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile?.name || userEmail}
                {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
              </span>
              <Button 
                variant="outline" 
                className="rounded-none"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Αποσύνδεση
              </Button>
            </div>
          )}
        </div>

        {/* Προγράμματα Προπόνησης */}
        <ShopProgramsSection />

        {products.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="p-8 text-center text-gray-500">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν διαθέσιμα προϊόντα</h3>
              <p>Δεν υπάρχουν προς το παρόν διαθέσιμα πακέτα για αγορά.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="rounded-none hover:shadow-lg transition-all duration-200 flex flex-col h-[400px]">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center items-center mb-4">
                    {product.subscription_mode === 'visit_based' ? (
                      <div className="bg-gray-100 p-3 rounded-full">
                        <MapPin className="w-6 h-6 text-gray-700" />
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-3 rounded-full">
                        <Calendar className="w-6 h-6 text-gray-700" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold">{product.name}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900">
                    €{product.price}
                    {product.subscription_mode === 'time_based' && (
                      <span className="text-sm text-gray-500 font-normal">/μήνα</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  )}

                  <div className="space-y-3 mb-6 flex-1">
                    {product.subscription_mode === 'visit_based' ? (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="flex items-center text-sm">
                            <Dumbbell className="w-4 h-4 mr-2 text-gray-500" />
                            Επισκέψεις
                          </span>
                          <Badge variant="secondary" className="rounded-none">
                            {product.visit_count}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="flex items-center text-sm">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            Λήξη σε
                          </span>
                          <Badge variant="secondary" className="rounded-none">
                            {product.visit_expiry_months} μήνες
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
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
                      disabled={loading === product.id}
                      className="w-full bg-black hover:bg-gray-800 text-white rounded-none"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {loading === product.id ? 'Φόρτωση...' : 'Αγορά Τώρα'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white border border-gray-200 rounded-none p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Πληροφορίες Αγοράς
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>• Οι πληρωμές επεξεργάζονται με ασφάλεια μέσω Stripe</p>
            <p>• Τα πακέτα επισκέψεων έχουν ημερομηνία λήξης όπως αναφέρεται</p>
            <p>• Μπορείς να ακυρώσεις ή να αναβάλεις τα ραντεβού σου</p>
            <p>• Για περισσότερες πληροφορίες επικοινώνησε μαζί μας</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;