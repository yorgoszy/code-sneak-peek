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
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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

const AdminShop = () => {
  const [newPurchases, setNewPurchases] = useState<Purchase[]>([]);
  const [readPurchases, setReadPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;

      const formattedPurchases: Purchase[] = (data || []).map(item => ({
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

      // Παίρνουμε τα acknowledged payment IDs από localStorage
      const acknowledgedIds = JSON.parse(localStorage.getItem('acknowledgedPayments') || '[]');
      const acknowledgedPaymentIds = new Set(acknowledgedIds);

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
    setMarkingAsRead(true);
    
    try {
      // Παίρνουμε τα υπάρχοντα acknowledged payment IDs
      const existingAcknowledged = JSON.parse(localStorage.getItem('acknowledgedPayments') || '[]');
      
      // Προσθέτουμε τα IDs των νέων αγορών
      const newAcknowledgedIds = newPurchases.map(purchase => purchase.id);
      const updatedAcknowledged = [...existingAcknowledged, ...newAcknowledgedIds];
      
      // Αποθηκεύουμε στο localStorage
      localStorage.setItem('acknowledgedPayments', JSON.stringify(updatedAcknowledged));
      
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[#00ffba]/10 p-2 rounded-full">
              <Package className="w-5 h-5 text-[#00ffba]" />
            </div>
            <div>
              <CardTitle className="text-lg">{purchase.subscription_type.name}</CardTitle>
              <p className="text-sm text-gray-600">{purchase.user.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-[#00ffba]">€{purchase.amount}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(purchase.payment_date), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span>{purchase.user.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span>{purchase.payment_method || 'Stripe'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>
              {purchase.subscription_type.subscription_mode === 'visit_based' 
                ? `${purchase.subscription_type.visit_count} επισκέψεις`
                : `${purchase.subscription_type.duration_months} μήνες`
              }
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="rounded-none">
              {purchase.status === 'completed' ? 'Ολοκληρωμένη' : purchase.status}
            </Badge>
          </div>
        </div>
        {purchase.subscription_type.description && (
          <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-none">
            {purchase.subscription_type.description}
          </p>
        )}
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
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Αγορές</h1>
            <p className="text-gray-600 mt-1">
              Διαχείριση όλων των αγορών πακέτων ({newPurchases.length + readPurchases.length} σύνολο)
            </p>
          </div>
          
          {newPurchases.length > 0 && (
            <Button
              onClick={handleMarkAsRead}
              disabled={markingAsRead}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              {markingAsRead ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Ενημερώθηκα
            </Button>
          )}
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