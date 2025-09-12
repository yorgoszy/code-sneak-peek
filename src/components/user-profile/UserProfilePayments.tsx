
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, FileText, Eye, Package, User, Calendar, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReceiptPreviewDialog } from "@/components/analytics/ReceiptPreviewDialog";
import { format } from "date-fns";

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
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      loadUserReceipts();
      loadUserPurchases();
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
        toast.error('Σφάλμα κατά τη φόρτωση των αποδείξεων');
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
      toast.error('Σφάλμα κατά τη φόρτωση των αποδείξεων');
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
          name: item.subscription_types?.name || 'Άγνωστο πακέτο',
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
      toast.error('Σφάλμα κατά τη φόρτωση των αγορών');
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
        return 'Εστάλη';
      case 'pending':
        return 'Εκκρεμεί';
      case 'error':
        return 'Σφάλμα';
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
                <span className="text-xs text-[#00ffba] font-medium">Προσφορά</span>
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
                  ? `${purchase.subscription_type.visit_count} επισκ.`
                  : `${purchase.subscription_type.duration_months} μήν.`
                }
              </span>
            </div>
            <Badge variant="secondary" className="rounded-none text-xs">
              {purchase.status === 'completed' ? 'Ολοκληρ.' : purchase.status}
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
                <span className="text-xs text-[#00ffba] font-medium">Προσφορά</span>
              )}
            </div>
          </div>

          {/* Κεντρικό μέρος - Συμπιεσμένα Στοιχεία */}
          <div className="flex items-center space-x-2 text-xs text-gray-600 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>
                {purchase.subscription_type.subscription_mode === 'visit_based' 
                  ? `${purchase.subscription_type.visit_count}επ`
                  : `${purchase.subscription_type.duration_months}μ`
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
                    <span className="text-[#00ffba] font-medium">Προσφορά</span>
                  )}
                  <span>
                    {purchase.subscription_type.subscription_mode === 'visit_based' 
                      ? `${purchase.subscription_type.visit_count} επισκ.`
                      : `${purchase.subscription_type.duration_months} μήν.`
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
                  <span className="text-xs text-[#00ffba] font-medium">Προσφορά</span>
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
                    ? `${purchase.subscription_type.visit_count} επισκ.`
                    : `${purchase.subscription_type.duration_months} μήν.`
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
      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-none">
          <TabsTrigger value="purchases" className="rounded-none">
            <Package className="w-4 h-4 mr-2" />
            Αγορές ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="receipts" className="rounded-none">
            <Receipt className="w-4 h-4 mr-2" />
            Αποδείξεις ({receipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="mt-4">
          <Card className="rounded-none">
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Φόρτωση αγορών...</p>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Δεν υπάρχουν αγορές για αυτόν τον χρήστη</p>
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
                  <p className="text-gray-500">Φόρτωση αποδείξεων...</p>
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Δεν υπάρχουν αποδείξεις για αυτόν τον χρήστη</p>
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
                                 ΜΑΡΚ: {receipt.invoice_mark}
                               </Badge>
                             )}
                           </div>
                          <p className="text-xs text-gray-600">{receipt.customer_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Ημερομηνία: {formatDate(receipt.issue_date)}
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
