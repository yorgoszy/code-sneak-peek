import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Clock, Users, MapPin, Calendar, Dumbbell } from "lucide-react";

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

interface UserProfileShopProps {
  userProfile: any;
}

export const UserProfileShop: React.FC<UserProfileShopProps> = ({ userProfile }) => {
  const [products, setProducts] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

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
      setLoading(false);
    }
  };

  const handlePurchase = async (product: SubscriptionType) => {
    setPurchasing(product.id);
    
    try {
      if (!userProfile) {
        toast.error('Δεν βρέθηκε το προφίλ χρήστη');
        return;
      }

      if (product.subscription_mode === 'visit_based') {
        // Create visit package
        const { error } = await supabase
          .from('visit_packages')
          .insert({
            user_id: userProfile.id,
            total_visits: product.visit_count || 1,
            remaining_visits: product.visit_count || 1,
            expiry_date: product.visit_expiry_months 
              ? new Date(Date.now() + (product.visit_expiry_months * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
              : null,
            price: product.price,
            status: 'active'
          });

        if (error) throw error;
        toast.success('Πακέτο επισκέψεων δημιουργήθηκε επιτυχώς!');
      } else {
        // Create subscription
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + product.duration_months);

        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userProfile.id,
            subscription_type_id: product.id,
            start_date: new Date().toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: 'active',
            is_paid: true
          });

        if (error) throw error;

        // Update user subscription status
        await supabase
          .from('app_users')
          .update({ subscription_status: 'active' })
          .eq('id', userProfile.id);

        toast.success('Συνδρομή δημιουργήθηκε επιτυχώς!');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Σφάλμα κατά την αγορά');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
            <p className="mt-2 text-gray-600">Φορτώνω τα προϊόντα...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Διαθέσιμα Πακέτα</h2>
        <p className="text-gray-600">Επιλέξτε το πακέτο που σας ταιριάζει καλύτερα</p>
      </div>

      {products.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="p-8 text-center text-gray-500">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν διαθέσιμα προϊόντα</h3>
            <p>Δεν υπάρχουν προς το παρόν διαθέσιμα πακέτα για αγορά.</p>
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
                  ) : (
                    <div className="bg-green-100 p-3 rounded-full">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl font-bold">{product.name}</CardTitle>
                <div className="text-3xl font-bold text-[#00ffba]">
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
                          <Dumbbell className="w-4 h-4 mr-2 text-blue-500" />
                          Επισκέψεις
                        </span>
                        <Badge variant="secondary" className="rounded-none">
                          {product.visit_count}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="flex items-center text-sm">
                          <Clock className="w-4 h-4 mr-2 text-blue-500" />
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
                        <Calendar className="w-4 h-4 mr-2 text-green-500" />
                        Διάρκεια
                      </span>
                      <Badge variant="secondary" className="rounded-none">
                        {product.duration_months} μήνες
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="mt-auto space-y-2">
                  <Button 
                    variant="outline"
                    className="w-full rounded-none"
                  >
                    Πληροφορίες
                  </Button>
                  <Button 
                    onClick={() => handlePurchase(product)}
                    disabled={purchasing === product.id}
                    className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {purchasing === product.id ? 'Επεξεργασία...' : 'Αγορά Τώρα'}
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