import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  User, 
  Calendar, 
  CreditCard, 
  Check,
  RefreshCw,
  Package,
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRoleCheck } from "@/hooks/useRoleCheck";

interface AdminShopProps {
  userProfile?: any;
  userEmail?: string;
  onSignOut?: () => void;
}

interface Purchase {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  subscription_type_id: string;
  user_id: string;
  transaction_id: string;
  payment_method: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  subscription_type: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_months: number;
    subscription_mode: string;
    visit_count?: number;
  };
}

const AdminShop = ({ userProfile, userEmail, onSignOut }: AdminShopProps = {}) => {
  const [newPurchases, setNewPurchases] = useState<Purchase[]>([]);
  const [readPurchases, setReadPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const { isAdmin } = useRoleCheck();

  useEffect(() => {
    if (userProfile?.id) {
      fetchPurchases();
    }
  }, [userProfile?.id]);

  const fetchPurchases = async () => {
    try {
      // Fetch all completed payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          app_users!user_id (
            id,
            name,
            email
          ),
          subscription_types!subscription_type_id (
            id,
            name,
            description,
            price,
            duration_months,
            subscription_mode,
            visit_count
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch acknowledged payment IDs from database for this admin
      const { data: acknowledgedData, error: acknowledgedError } = await supabase
        .from('acknowledged_payments')
        .select('payment_id')
        .eq('admin_user_id', userProfile?.id || '');

      if (acknowledgedError) throw acknowledgedError;

      const acknowledgedPaymentIds = new Set(
        (acknowledgedData || []).map(item => item.payment_id)
      );

      const formattedPurchases: Purchase[] = (paymentsData || []).map(item => ({
        id: item.id,
        amount: item.amount,
        payment_date: item.payment_date,
        status: item.status,
        subscription_type_id: item.subscription_type_id,
        user_id: item.user_id,
        transaction_id: item.transaction_id,
        payment_method: item.payment_method,
        created_at: item.created_at,
        user: {
          id: item.app_users?.id || '',
          name: item.app_users?.name || 'Άγνωστος',
          email: item.app_users?.email || ''
        },
        subscription_type: {
          id: item.subscription_types?.id || '',
          name: item.subscription_types?.name || 'Άγνωστο πακέτο',
          description: item.subscription_types?.description || '',
          price: item.subscription_types?.price || 0,
          duration_months: item.subscription_types?.duration_months || 0,
          subscription_mode: item.subscription_types?.subscription_mode || '',
          visit_count: item.subscription_types?.visit_count
        }
      }));

      // Διαχωρισμός αγορών με βάση το αν έχουν επισημανθεί ως "ενημερώθηκα"
      const newPurchasesData = formattedPurchases.filter(purchase => 
        !acknowledgedPaymentIds.has(purchase.id)
      );
      setNewPurchases(newPurchasesData);
      
      const acknowledgedPurchases = formattedPurchases.filter(purchase => 
        acknowledgedPaymentIds.has(purchase.id)
      );
      setReadPurchases(acknowledgedPurchases);
      
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των αγορών');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (!userProfile?.id) {
      toast.error('Δεν βρέθηκε ο χρήστης');
      return;
    }

    setMarkingAsRead(true);
    
    try {
      // Insert acknowledged payments to database
      const acknowledgeRecords = newPurchases.map(purchase => ({
        payment_id: purchase.id,
        admin_user_id: userProfile.id
      }));

      const { error } = await supabase
        .from('acknowledged_payments')
        .insert(acknowledgeRecords);

      if (error) throw error;
      
      // Μεταφορά νέων αγορών στο "Ενημερώθηκα"
      setReadPurchases(prev => [...prev, ...newPurchases]);
      setNewPurchases([]);
      
      // Αλλάζουμε στο tab "Ενημερώθηκα"
      setActiveTab("read");
      
      // Στέλνουμε event για το sidebar
      window.dispatchEvent(new CustomEvent('purchases-acknowledged'));
      
      toast.success('Όλες οι νέες αγορές μεταφέρθηκαν στο "Ενημερώθηκα"');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
    } finally {
      setMarkingAsRead(false);
    }
  };

  const renderPurchaseCard = (purchase: Purchase) => (
    <Card key={purchase.id} className="rounded-none hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        {/* Mobile layout - stacked */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="bg-[#00ffba]/10 p-1.5 rounded-full flex-shrink-0">
                <Package className="w-4 h-4 text-[#00ffba]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{purchase.subscription_type.name}</h3>
                <p className="text-xs text-gray-600 truncate">{purchase.user.name}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-[#00ffba]">€{purchase.amount}</p>
              <Badge variant="secondary" className="rounded-none text-xs px-1 py-0.5 mt-1">
                <Check className="w-3 h-3" />
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>
                {purchase.subscription_type.subscription_mode === 'visit_based' 
                  ? `${purchase.subscription_type.visit_count} επισκέψεις`
                  : `${purchase.subscription_type.duration_months}μ`
                }
              </span>
            </div>
            <span>{format(new Date(purchase.payment_date), 'dd/MM/yyyy')}</span>
          </div>
        </div>

        {/* Desktop/Tablet layout - horizontal */}
        <div className="hidden sm:flex items-center justify-between h-10">
          {/* Left section - Icon, Name, User */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="bg-[#00ffba]/10 p-1.5 rounded-full flex-shrink-0">
              <Package className="w-4 h-4 text-[#00ffba]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{purchase.subscription_type.name}</h3>
              <p className="text-xs text-gray-600 truncate">{purchase.user.name} • {purchase.user.email}</p>
            </div>
          </div>

          {/* Center section - Duration/Visits */}
          <div className="flex items-center space-x-1 text-xs text-gray-500 px-4">
            <Calendar className="w-3 h-3" />
            <span>
              {purchase.subscription_type.subscription_mode === 'visit_based' 
                ? `${purchase.subscription_type.visit_count} επισκέψεις`
                : `${purchase.subscription_type.duration_months}μ`
              }
            </span>
          </div>

          {/* Right section - Price, Date, Status */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-sm font-bold text-[#00ffba]">€{purchase.amount}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(purchase.payment_date), 'dd/MM')}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-none text-xs px-2 py-1">
              <Check className="w-3 h-3" />
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
          <p className="mt-2 text-gray-600">Φορτώνω τις αγορές...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile/Tablet responsive header */}
        <div className="space-y-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Αγορές</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Διαχείριση όλων των αγορών πακέτων ({newPurchases.length + readPurchases.length} σύνολο)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {newPurchases.length > 0 && (
              <Button
                onClick={handleMarkAsRead}
                disabled={markingAsRead}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none w-full sm:w-auto"
              >
                {markingAsRead ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Ενημερώθηκα
              </Button>
            )}
            
            {userProfile && onSignOut && (
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center">
                  <span>{userProfile?.name || userEmail}</span>
                  {isAdmin() && <span className="mt-1 sm:mt-0 sm:ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded w-fit">Admin</span>}
                </span>
                <Button 
                  variant="outline" 
                  className="rounded-none w-full sm:w-auto"
                  onClick={onSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Αποσύνδεση
                </Button>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="new" className="rounded-none">
              Νέες Αγορές ({newPurchases.length})
            </TabsTrigger>
            <TabsTrigger value="read" className="rounded-none">
              Ενημερώθηκα ({readPurchases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <div className="space-y-4">
              {newPurchases.length === 0 ? (
                <Card className="rounded-none">
                  <CardContent className="p-8 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν νέες αγορές</h3>
                    <p>Δεν υπάρχουν νέες αγορές τις τελευταίες 7 ημέρες.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {newPurchases.map(renderPurchaseCard)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="read" className="mt-6">
            <div className="space-y-4">
              {readPurchases.length === 0 ? (
                <Card className="rounded-none">
                  <CardContent className="p-8 text-center text-gray-500">
                    <Check className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ενημερώθηκα</h3>
                    <p>Εδώ θα εμφανίζονται οι αγορές που έχεις δει.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {readPurchases.map(renderPurchaseCard)}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminShop;
