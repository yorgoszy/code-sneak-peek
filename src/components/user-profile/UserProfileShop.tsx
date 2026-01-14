import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Clock, Users, MapPin, Calendar, Dumbbell, History, Video } from "lucide-react";
import { UserProfileShopHistory } from "./UserProfileShopHistory";

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
}

interface UserProfileShopProps {
  userProfile: any;
}

export const UserProfileShop: React.FC<UserProfileShopProps> = ({ userProfile }) => {
  const { t } = useTranslation();
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
        .select('id, name, description, price, duration_months, subscription_mode, visit_count, visit_expiry_months, is_active, available_in_shop, coach_shop_only')
        .eq('is_active', true)
        .eq('available_in_shop', true)
        .or('coach_shop_only.is.null,coach_shop_only.eq.false')
        .order('price');

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        ...item,
        subscription_mode: (item.subscription_mode || 'time_based') as 'time_based' | 'visit_based' | 'videocall',
        available_in_shop: item.available_in_shop || false
      })) as SubscriptionType[];

      setProducts(typedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('shop.errorLoadingProducts'));
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
          productName: product.name
        }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(t('shop.errorCreatingPayment'));
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
            <p className="mt-2 text-gray-600">{t('shop.loadingProducts')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="shop" className="w-full">
      <TabsList className="grid w-full grid-cols-2 rounded-none mb-6">
        <TabsTrigger value="shop" className="rounded-none flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          {t('shop.shop')}
        </TabsTrigger>
        <TabsTrigger value="history" className="rounded-none flex items-center gap-2">
          <History className="w-4 h-4" />
          {t('shop.purchaseHistory')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="shop" className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('shop.availablePackages')}</h2>
          <p className="text-gray-600">{t('shop.selectPackage')}</p>
        </div>

        {products.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="p-8 text-center text-gray-500">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('shop.noProducts')}</h3>
              <p>{t('shop.noProductsAvailable')}</p>
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
                      <span className="text-sm text-gray-500 font-normal">{t('shop.perMonth')}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">

                  <div className="space-y-3 mb-6 flex-1">
                    {product.subscription_mode === 'visit_based' ? (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="flex items-center text-sm">
                            <Dumbbell className="w-4 h-4 mr-2 text-blue-500" />
                            {t('shop.visits')}
                          </span>
                          <Badge variant="secondary" className="rounded-none">
                            {product.visit_count}
                          </Badge>
                        </div>
                        {product.visit_expiry_months && (
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="flex items-center text-sm">
                              <Clock className="w-4 h-4 mr-2 text-blue-500" />
                              {t('shop.expiresIn')}
                            </span>
                            <Badge variant="secondary" className="rounded-none">
                              {product.visit_expiry_months} {t('shop.months')}
                            </Badge>
                          </div>
                        )}
                      </>
                    ) : product.subscription_mode === 'videocall' ? (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="flex items-center text-sm">
                            <Video className="w-4 h-4 mr-2 text-purple-500" />
                            {t('shop.calls')}
                          </span>
                          <Badge variant="secondary" className="rounded-none">
                            {product.visit_count}
                          </Badge>
                        </div>
                        {product.visit_expiry_months && (
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="flex items-center text-sm">
                              <Clock className="w-4 h-4 mr-2 text-purple-500" />
                              {t('shop.expiresIn')}
                            </span>
                            <Badge variant="secondary" className="rounded-none">
                              {product.visit_expiry_months} {t('shop.months')}
                            </Badge>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-green-500" />
                          {t('shop.duration')}
                        </span>
                        <Badge variant="secondary" className="rounded-none">
                          {product.duration_months} {t('shop.months')}
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
                      {purchasing === product.id ? t('shop.processing') : t('shop.buyNow')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <UserProfileShopHistory userProfile={userProfile} />
      </TabsContent>
    </Tabs>
  );
};