import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, Users, Dumbbell, MapPin, Calendar, LogOut } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const ShopWithSidebar = () => {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const { userProfile: dashboardUserProfile } = useDashboard();
  const { isAdmin } = useRoleCheck();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [products, setProducts] = useState<SubscriptionType[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, description, price, duration_months, subscription_mode, visit_count, visit_expiry_months, is_active, available_in_shop')
        .eq('is_active', true)
        .eq('available_in_shop', true)
        .order('price') as { data: SubscriptionType[] | null, error: any };

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των προϊόντων');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handlePurchase = async (product: SubscriptionType) => {
    setLoading(product.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: product.price,
          currency: "eur",
          productName: product.name,
          productId: product.id
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

  const handleMockPurchase = async (product: SubscriptionType) => {
    setLoading(product.id);
    
    try {
      if (!user) {
        toast.error('Δεν είστε συνδεδεμένοι');
        return;
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

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
      console.error('Mock purchase error:', error);
      toast.error('Σφάλμα κατά τη δημιουργία πακέτου');
    } finally {
      setLoading(null);
    }
  };

  const getProductIcon = (product: SubscriptionType) => {
    if (product.subscription_mode === 'visit_based') {
      return <Dumbbell className="w-6 h-6" />;
    }
    if (product.name.toLowerCase().includes('personal') || product.name.toLowerCase().includes('προσωπική')) {
      return <Users className="w-6 h-6" />;
    }
    if (product.name.toLowerCase().includes('συμβουλευτική') || product.name.toLowerCase().includes('consultation')) {
      return <Clock className="w-6 h-6" />;
    }
    return <Dumbbell className="w-6 h-6" />;
  };

  const getProductBadge = (product: SubscriptionType) => {
    if (product.subscription_mode === 'visit_based' && product.visit_count && product.visit_count >= 10) {
      return "Καλύτερη Αξία";
    }
    if (product.subscription_mode === 'visit_based' && product.visit_count && product.visit_count === 5) {
      return "Δημοφιλές";
    }
    return null;
  };

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Shop Content */}
        <div className="flex-1 p-3 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Αγορές</h1>
                <p className="text-gray-600">
                  Αγόρασε πακέτα επισκέψεων, personal training και άλλες υπηρεσίες
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {dashboardUserProfile?.name || user?.email}
                  {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                </span>
                <Button 
                  variant="outline" 
                  className="rounded-none"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Αποσύνδεση
                </Button>
              </div>
            </div>

            {loadingProducts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
                <p className="mt-2 text-gray-600">Φορτώνουν τα προϊόντα...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Δεν υπάρχουν διαθέσιμα προϊόντα αυτή τη στιγμή</p>
                <p className="text-sm mt-2">Επικοινωνήστε με τη διοίκηση για περισσότερες πληροφορίες</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="rounded-none hover:shadow-lg transition-shadow h-[500px] flex flex-col">
                    <CardHeader className="text-center flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 bg-[#00ffba] text-black rounded-none mx-auto mb-4">
                        {getProductIcon(product)}
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        {getProductBadge(product) && (
                          <Badge variant="secondary" className="rounded-none text-xs">
                            {getProductBadge(product)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600">{product.description}</p>
                      
                      {/* Product Details */}
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {product.subscription_mode === 'visit_based' ? (
                          <>
                            <Badge variant="outline" className="rounded-none bg-blue-50 text-blue-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              {product.visit_count} επισκέψεις
                            </Badge>
                            {product.visit_expiry_months && (
                              <Badge variant="outline" className="rounded-none bg-gray-50 text-gray-600">
                                <Calendar className="w-3 h-3 mr-1" />
                                {product.visit_expiry_months} μήνες
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="rounded-none bg-green-50 text-green-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {product.duration_months} μήνες
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    {/* Flexible content area */}
                    <div className="flex-1"></div>
                    
                    {/* Fixed bottom section with price and button */}
                    <CardContent className="text-center flex-shrink-0 mt-auto">
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">€{product.price}</span>
                      </div>
                      
                      <Button 
                        onClick={() => handlePurchase(product)}
                        disabled={loading === product.id}
                        className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {loading === product.id ? 'Φόρτωση...' : 'Αγορά Τώρα'}
                      </Button>
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
                <p>• Τα πακέτα επισκέψεων δεν έχουν ημερομηνία λήξης</p>
                <p>• Μπορείς να ακυρώσεις ή να αναβάλεις τα ραντεβού σου</p>
                <p>• Για περισσότερες πληροφορίες επικοινώνησε μαζί μας</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopWithSidebar;