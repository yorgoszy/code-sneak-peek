
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, FileText, Eye, Package, User, Calendar, CreditCard, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { el } from "date-fns/locale";

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
  // Coach receipt specific fields
  subscription_type_name?: string;
  receipt_type?: string;
}

interface CoachProfileData {
  business_name: string | null;
  logo_url: string | null;
  vat_number: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
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

// Έλεγχος αν ο χρήστης δημιουργήθηκε από coach
const isCoachCreatedUser = (profile: any) => !profile?.auth_user_id && profile?.coach_id;

export const UserProfilePayments = ({ payments, userProfile }: UserProfilePaymentsProps) => {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [coachProfile, setCoachProfile] = useState<CoachProfileData | null>(null);

  const isCoachUser = isCoachCreatedUser(userProfile);

  useEffect(() => {
    if (userProfile?.id) {
      loadUserReceipts();
      if (!isCoachUser) {
        loadUserPurchases();
      }
      if (isCoachUser && userProfile?.coach_id) {
        fetchCoachProfile();
      }
    }
  }, [userProfile?.id, isCoachUser]);

  const fetchCoachProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('business_name, logo_url, vat_number, address, city, phone')
        .eq('coach_id', userProfile.coach_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCoachProfile(data);
    } catch (error) {
      console.error('Error fetching coach profile:', error);
    }
  };

  const loadUserReceipts = async () => {
    try {
      setLoading(true);
      
      // Για coach-created users, φέρνουμε από coach_receipts
      if (isCoachUser && userProfile?.coach_id) {
        // Φέρνουμε αποδείξεις από coach_receipts με βάση το user_id του αθλητή
        const { data, error } = await supabase
          .from('coach_receipts')
          .select(`
            *,
            subscription_types:subscription_type_id (name)
          `)
          .eq('user_id', userProfile.id)
          .eq('coach_id', userProfile.coach_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading coach receipts:', error);
          toast.error(t('payments.errorLoadingReceipts'));
          return;
        }

        // Transform coach_receipts data
        const transformedReceipts: ReceiptData[] = (data || []).map((receipt: any) => ({
          id: receipt.id,
          receipt_number: receipt.receipt_number,
          customer_name: userProfile.name || 'Πελάτης',
          customer_vat: undefined,
          customer_email: userProfile.email,
          items: [{
            id: receipt.id,
            description: receipt.subscription_types?.name || receipt.notes || 'Συνδρομή',
            quantity: 1,
            unitPrice: Number(receipt.amount),
            vatRate: 0,
            total: Number(receipt.amount)
          }],
          subtotal: Number(receipt.amount),
          vat: 0,
          total: Number(receipt.amount),
          issue_date: receipt.created_at,
          mydata_status: receipt.mark ? 'sent' : 'pending' as 'pending' | 'sent' | 'error',
          mydata_id: undefined,
          invoice_mark: receipt.mark || undefined,
          subscription_type_name: receipt.subscription_types?.name,
          receipt_type: receipt.receipt_type
        }));

        setReceipts(transformedReceipts);
      } else {
        // Για κανονικούς χρήστες, φέρνουμε από receipts
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
      }
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

  const handleViewReceipt = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setIsPreviewOpen(true);
  };

  const handlePrintReceipt = async (receipt: ReceiptData) => {
    // Απλά ανοίγουμε το dialog - η εκτύπωση γίνεται μέσα στο dialog
    setSelectedReceipt(receipt);
    setIsPreviewOpen(true);
  };

  const getReceiptTypeLabel = (type: string | undefined) => {
    if (!type) return '-';
    switch (type) {
      case 'subscription': return 'Νέα';
      case 'renewal': return 'Ανανέωση';
      default: return type;
    }
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
      {isCoachUser ? (
        // Για coach-created users, δείχνουμε μόνο αποδείξεις (χωρίς tabs)
        <Card className="rounded-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-[#00ffba]" />
              <h3 className="font-medium">{t('payments.receipts')} ({receipts.length})</h3>
            </div>
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
                          title="Προβολή"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintReceipt(receipt)}
                          className="rounded-none text-xs px-2 py-1"
                          title="Εκτύπωση"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Για κανονικούς χρήστες, tabs με Αγορές και Αποδείξεις
        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="purchases" className="rounded-none">
              <Package className="w-4 h-4 mr-2" />
              {t('payments.purchases')} ({purchases.length})
            </TabsTrigger>
            <TabsTrigger value="receipts" className="rounded-none">
              <Receipt className="w-4 h-4 mr-2" />
              {t('payments.receipts')} ({receipts.length})
            </TabsTrigger>
          </TabsList>

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
                            title="Προβολή"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintReceipt(receipt)}
                            className="rounded-none text-xs px-2 py-1"
                            title="Εκτύπωση"
                          >
                            <Printer className="h-3 w-3" />
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
      )}

      {/* Receipt Preview Dialog - Ίδιο με Coach */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle>Απόδειξη {selectedReceipt?.receipt_number}</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4 text-sm">
              {/* Athlete Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userProfile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {userProfile?.name?.charAt(0) || 'Α'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{userProfile?.name || '-'}</p>
                  <p className="text-xs text-gray-500">{userProfile?.email || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Ημερομηνία:</span>
                  <p>{format(new Date(selectedReceipt.issue_date), 'dd/MM/yyyy', { locale: el })}</p>
                </div>
                <div>
                  <span className="text-gray-500">Τύπος:</span>
                  <p>{selectedReceipt.subscription_type_name || selectedReceipt.items?.[0]?.description || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Είδος:</span>
                  <p>{getReceiptTypeLabel(selectedReceipt.receipt_type)}</p>
                </div>
                <div>
                  <span className="text-gray-500">ΜΑΡΚ ΑΑΔΕ:</span>
                  <p>{selectedReceipt.invoice_mark || '-'}</p>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <span className="text-gray-500 text-xs">Ποσό:</span>
                <p className="text-xl font-bold text-[#00ffba]">€{selectedReceipt.total.toFixed(2)}</p>
              </div>

              {/* Coach Business Info */}
              {coachProfile && (coachProfile.business_name || coachProfile.logo_url) && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-3">
                    {coachProfile.logo_url && (
                      <img 
                        src={coachProfile.logo_url} 
                        alt="Logo" 
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      {coachProfile.business_name && (
                        <p className="font-medium text-xs">{coachProfile.business_name}</p>
                      )}
                      <div className="text-[10px] text-gray-500">
                        {coachProfile.address && <span>{coachProfile.address}</span>}
                        {coachProfile.city && <span>, {coachProfile.city}</span>}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {coachProfile.vat_number && <span>ΑΦΜ: {coachProfile.vat_number}</span>}
                        {coachProfile.phone && <span> | Τηλ: {coachProfile.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => window.print()}
                  className="rounded-none flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Εκτύπωση
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
