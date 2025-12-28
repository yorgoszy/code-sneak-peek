
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, FileText, Eye, Package, User, Calendar, CreditCard, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReceiptPreviewDialog } from "@/components/analytics/ReceiptPreviewDialog";
import { format } from "date-fns";
import { UserSubscriptionCard } from "./UserSubscriptionCard";

interface UserProfilePaymentsProps {
  payments: any[];
  userProfile: any;
}

interface ReceiptData {
  id: string;
  receipt_number: string;
  customer_name: string;
  customer_vat?: string;
  customer_email?: string;
  items: any[];
  subtotal: number;
  vat: number;
  total: number;
  issue_date: string;
  mydata_status: 'pending' | 'sent' | 'error';
  mydata_id?: string;
  invoice_mark?: string;
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
  offer_id?: string;
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

export const UserProfilePayments = ({ payments, userProfile }: UserProfilePaymentsProps) => {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      loadUserReceipts();
      loadUserPurchases();
      loadUserSubscriptions();
      loadSubscriptionTypes();
    }
  }, [userProfile?.id]);

  const loadUserReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading receipts:', error);
        toast.error(t('payments.errorLoadingReceipts'));
        return;
      }

      // Transform data to match ReceiptData interface
      const transformedReceipts: ReceiptData[] = (data || []).map((receipt) => ({
        id: receipt.id,
        receipt_number: receipt.receipt_number,
        customer_name: receipt.customer_name,
        customer_vat: receipt.customer_vat,
        customer_email: receipt.customer_email,
        items: Array.isArray(receipt.items) ? receipt.items : [],
        subtotal: Number(receipt.subtotal),
        vat: Number(receipt.vat),
        total: Number(receipt.total),
        issue_date: receipt.issue_date,
        mydata_status: receipt.mydata_status as 'pending' | 'sent' | 'error',
        mydata_id: receipt.mydata_id,
        invoice_mark: receipt.invoice_mark
      }));

      setReceipts(transformedReceipts);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error(t('payments.errorLoadingReceipts'));
    } finally {
      setLoading(false);
    }
  };

  const loadUserPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
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
        .eq('user_id', userProfile.id)
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
        offer_id: item.offer_id,
        subscription_type: {
          id: item.subscription_types?.id || '',
          name: item.subscription_types?.name || t('payments.unknownPackage'),
          description: item.subscription_types?.description || '',
          price: item.subscription_types?.price || 0,
          duration_months: item.subscription_types?.duration_months || 0,
          subscription_mode: item.subscription_types?.subscription_mode || '',
          visit_count: item.subscription_types?.visit_count
        }
      }));

      setPurchases(formattedPurchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
      toast.error(t('payments.errorLoadingPurchases'));
    }
  };

  const loadUserSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (id, name, price, duration_months)
        `)
        .eq('user_id', userProfile.id)
        .in('status', ['active', 'expired'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const loadSubscriptionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, price, duration_months')
        .eq('is_active', true);

      if (error) throw error;

      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error('Error loading subscription types:', error);
    }
  };

  const handleViewReceipt = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setIsPreviewOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('el-GR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return t('payments.sent');
      case 'pending':
        return t('payments.pending');
      case 'error':
        return t('payments.error');
      default:
        return status;
    }
  };

  const renderPurchaseCard = (purchase: Purchase) => (
    <Card key={purchase.id} className="rounded-none hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        {/* Desktop Layout - Large screens */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Αριστερό μέρος - Εικονίδιο και Όνομα */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="bg-[#00ffba]/10 p-2 rounded-full flex-shrink-0">
              <Package className="w-4 h-4 text-[#00ffba]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{purchase.subscription_type.name}</h4>
              {purchase.offer_id && (
                <span className="text-xs text-[#00ffba] font-medium">{t('payments.offer')}</span>
              )}
            </div>
          </div>

          {/* Κεντρικό μέρος - Στοιχεία */}
            <div className="flex items-center space-x-4 text-xs text-gray-600 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <CreditCard className="w-3 h-3" />
              <span>{purchase.payment_method || 'Stripe'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>
                {purchase.subscription_type.subscription_mode === 'visit_based' 
                  ? `${purchase.subscription_type.visit_count} ${t('payments.visits')}`
                  : `${purchase.subscription_type.duration_months} ${t('payments.months')}`
                }
              </span>
            </div>
            <Badge variant="secondary" className="rounded-none text-xs">
              {purchase.status === 'completed' ? t('payments.completed') : purchase.status}
            </Badge>
          </div>

          {/* Δεξιό μέρος - Ποσό και Ημερομηνία */}
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-lg font-bold text-[#00ffba]">€{purchase.amount}</p>
            <p className="text-xs text-gray-500">
              {format(new Date(purchase.payment_date), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        {/* Tablet Layout - Medium screens */}
        <div className="hidden md:flex lg:hidden items-center justify-between">
          {/* Αριστερό μέρος - Εικονίδιο και Όνομα */}
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="bg-[#00ffba]/10 p-1.5 rounded-full flex-shrink-0">
              <Package className="w-4 h-4 text-[#00ffba]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{purchase.subscription_type.name}</h4>
              {purchase.offer_id && (
                <span className="text-xs text-[#00ffba] font-medium">{t('payments.offer')}</span>
              )}
            </div>
          </div>

          {/* Κεντρικό μέρος - Συμπιεσμένα Στοιχεία */}
          <div className="flex items-center space-x-2 text-xs text-gray-600 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>
                {purchase.subscription_type.subscription_mode === 'visit_based' 
                  ? `${purchase.subscription_type.visit_count}${t('payments.visits')}`
                  : `${purchase.subscription_type.duration_months}${t('payments.months')}`
                }
              </span>
            </div>
            <Badge variant="secondary" className="rounded-none text-xs px-1">
              {purchase.status === 'completed' ? '✓' : purchase.status}
            </Badge>
          </div>

          {/* Δεξιό μέρος - Ποσό και Ημερομηνία */}
          <div className="text-right flex-shrink-0 ml-3">
            <p className="text-base font-bold text-[#00ffba]">€{purchase.amount}</p>
            <p className="text-xs text-gray-500">
              {format(new Date(purchase.payment_date), 'dd/MM')}
            </p>
          </div>
        </div>

        {/* Small Tablet Layout */}
        <div className="hidden sm:flex md:hidden">
          <div className="flex items-center justify-between w-full">
            {/* Αριστερό μέρος */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="bg-[#00ffba]/10 p-1.5 rounded-full flex-shrink-0">
                <Package className="w-3 h-3 text-[#00ffba]" />
              </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{purchase.subscription_type.name}</h4>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                {purchase.offer_id && (
                  <span className="text-[#00ffba] font-medium">{t('payments.offer')}</span>
                )}
                <span>
                  {purchase.subscription_type.subscription_mode === 'visit_based' 
                    ? `${purchase.subscription_type.visit_count} ${t('payments.visits')}`
                    : `${purchase.subscription_type.duration_months} ${t('payments.months')}`
                  }
                </span>
              </div>
            </div>
            </div>

            {/* Δεξιό μέρος */}
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-[#00ffba]">€{purchase.amount}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(purchase.payment_date), 'dd/MM/yy')}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Small screens */}
        <div className="sm:hidden space-y-3">
          {/* Πρώτη γραμμή - Όνομα και Ποσό */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="bg-[#00ffba]/10 p-1.5 rounded-full flex-shrink-0">
                <Package className="w-3 h-3 text-[#00ffba]" />
              </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm truncate">{purchase.subscription_type.name}</h4>
              {purchase.offer_id && (
                <span className="text-xs text-[#00ffba] font-medium">{t('payments.offer')}</span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-[#00ffba]">€{purchase.amount}</p>
          </div>
        </div>

        {/* Δεύτερη γραμμή - Λεπτομέρειες */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>
                {purchase.subscription_type.subscription_mode === 'visit_based' 
                  ? `${purchase.subscription_type.visit_count} ${t('payments.visits')}`
                  : `${purchase.subscription_type.duration_months} ${t('payments.months')}`
                }
              </span>
            </div>
            <Badge variant="secondary" className="rounded-none text-xs">
              ✓
            </Badge>
          </div>
            <div className="text-xs text-gray-500">
              {format(new Date(purchase.payment_date), 'dd/MM/yy')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          <TabsTrigger value="subscriptions" className="rounded-none">
            <Crown className="w-4 h-4 mr-2" />
            Συνδρομές ({subscriptions.filter(s => s.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="rounded-none">
            <Package className="w-4 h-4 mr-2" />
            {t('payments.purchases')} ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="receipts" className="rounded-none">
            <Receipt className="w-4 h-4 mr-2" />
            {t('payments.receipts')} ({receipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-4">
          <Card className="rounded-none">
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Φόρτωση συνδρομών...</p>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Δεν υπάρχουν συνδρομές</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map(sub => (
                    <UserSubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onRefresh={loadUserSubscriptions}
                      subscriptionTypes={subscriptionTypes}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          <Card className="rounded-none">
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('payments.loadingPurchases')}</p>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">{t('payments.noPurchases')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map(renderPurchaseCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <Card className="rounded-none">
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('payments.loadingReceipts')}</p>
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">{t('payments.noReceipts')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="border border-gray-200 p-2 rounded-none hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-medium text-sm">{receipt.receipt_number}</h4>
                             {receipt.invoice_mark && (
                               <Badge className="text-xs bg-green-100 text-green-800 px-1 py-0.5">
                                 {t('payments.mark')}: {receipt.invoice_mark}
                               </Badge>
                             )}
                           </div>
                          <p className="text-xs text-gray-600">{receipt.customer_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t('payments.date')}: {formatDate(receipt.issue_date)}
                          </p>
                          <p className="text-base font-bold text-[#00ffba] mt-1">
                            €{receipt.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(receipt)}
                            className="rounded-none text-xs px-2 py-1"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Preview Dialog */}
      <ReceiptPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        receipt={selectedReceipt ? {
          id: selectedReceipt.id,
          receiptNumber: selectedReceipt.receipt_number,
          customerName: selectedReceipt.customer_name,
          customerVat: selectedReceipt.customer_vat,
          customerEmail: selectedReceipt.customer_email,
          items: selectedReceipt.items,
          subtotal: selectedReceipt.subtotal,
          vat: selectedReceipt.vat,
          total: selectedReceipt.total,
          date: selectedReceipt.issue_date,
          myDataStatus: selectedReceipt.mydata_status,
          myDataId: selectedReceipt.mydata_id,
          invoiceMark: selectedReceipt.invoice_mark
        } : null}
      />
    </>
  );
};
