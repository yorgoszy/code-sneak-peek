import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Receipt, 
  Send, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Euro,
  User,
  Building2,
  Download,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ReceiptPreviewDialog } from "./ReceiptPreviewDialog";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AppUser {
  id: string;
  name: string;
  email: string;
}

interface SubscriptionType {
  id: string;
  name: string;
  price: number;
}

interface ReceiptData {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerVat?: string;
  customerEmail?: string;
  items: ReceiptItem[];
  subtotal: number;
  vat: number;
  total: number;
  date: string;
  startDate?: string;
  endDate?: string;
  myDataStatus: 'pending' | 'sent' | 'error';
  myDataId?: string;
  invoiceMark?: string; // Αριθμός ΜΑΡΚ από MyData
}

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

interface MyDataSettings {
  aadeUserId: string;
  subscriptionKey: string;
  environment: 'development' | 'production';
  connected: boolean;
}

export const ReceiptManagement: React.FC = () => {
  const [settings, setSettings] = useState<MyDataSettings>({
    aadeUserId: localStorage.getItem('mydata_aade_user_id') || '',
    subscriptionKey: localStorage.getItem('mydata_subscription_key') || '',
    environment: 'production',
    connected: false
  });

  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSubscriptionType, setSelectedSubscriptionType] = useState<string>('');
  
  const [newReceipt, setNewReceipt] = useState<Partial<ReceiptData>>({
    customerName: '',
    customerVat: '',
    customerEmail: '',
    items: [{
      id: '1',
      description: 'Premium Subscription',
      quantity: 1,
      unitPrice: 49.99,
      vatRate: 13,
      total: 56.49
    }]
  });

  const [receiptSeries, setReceiptSeries] = useState<'ΑΠΥ' | 'ΤΠΥ'>('ΑΠΥ');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    // Φόρτωση αποδείξεων πάντα, ανεξάρτητα από το MyData connection
    loadReceipts();
    loadUsers();
    loadSubscriptionTypes();
    
    if (settings.aadeUserId && settings.subscriptionKey) {
      setSettings(prev => ({ ...prev, connected: true }));
    }
  }, []);

  const handleConnect = () => {
    if (!settings.aadeUserId || !settings.subscriptionKey) {
      toast.error('Παρακαλώ συμπληρώστε τα στοιχεία σύνδεσης MyData');
      return;
    }

    localStorage.setItem('mydata_aade_user_id', settings.aadeUserId);
    localStorage.setItem('mydata_subscription_key', settings.subscriptionKey);
    
    setSettings(prev => ({ ...prev, connected: true }));
    toast.success('Επιτυχής σύνδεση με MyData AADE!');
    loadReceipts();
  };

  const loadReceipts = async () => {
    setLoading(true);
    try {
      console.log('🔄 Φόρτωση αποδείξεων από τη βάση δεδομένων...');
      
      // Φόρτωση αποδείξεων από τον πίνακα receipts
      const { data: receiptsData, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading receipts:', error);
        throw error;
      }
      
      console.log('📋 Loaded receipts:', receiptsData?.length || 0, receiptsData);

      // Μετατροπή από βάση δεδομένων σε ReceiptData format
      const receiptData: ReceiptData[] = (receiptsData || []).map((receipt) => ({
        id: receipt.id,
        receiptNumber: receipt.receipt_number,
        customerName: receipt.customer_name,
        customerVat: receipt.customer_vat,
        customerEmail: receipt.customer_email,
        items: (receipt.items as unknown as ReceiptItem[]) || [],
        subtotal: Number(receipt.subtotal),
        vat: Number(receipt.vat),
        total: Number(receipt.total),
        date: receipt.issue_date,
        myDataStatus: receipt.mydata_status as 'pending' | 'sent' | 'error',
        myDataId: receipt.mydata_id || undefined,
        invoiceMark: receipt.invoice_mark || undefined
      }));

      setReceipts(receiptData);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Σφάλμα στη φόρτωση αποδείξεων');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email')
        .order('name');

      if (error) {
        console.error('❌ Error loading users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSubscriptionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('id, name, price')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Error loading subscription types:', error);
        return;
      }

      setSubscriptionTypes(data || []);
    } catch (error) {
      console.error('Error loading subscription types:', error);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(userId);
      setNewReceipt(prev => ({
        ...prev,
        customerName: user.name,
        customerEmail: user.email
      }));
    }
  };

  const handleSubscriptionTypeSelect = (typeId: string) => {
    const subType = subscriptionTypes.find(st => st.id === typeId);
    if (subType) {
      setSelectedSubscriptionType(typeId);
      const updatedItems = [...(newReceipt.items || [])];
      if (updatedItems.length > 0) {
        // Η τιμή που θα βάλει ο χρήστης θα είναι η τελική (με ΦΠΑ)
        const finalPrice = subType.price;
        const vatRate = updatedItems[0].vatRate || 13;
        const netPrice = finalPrice / (1 + vatRate / 100); // Αφαιρούμε ΦΠΑ για να βρούμε καθαρό
        
        updatedItems[0] = {
          ...updatedItems[0],
          description: subType.name,
          unitPrice: netPrice,
          total: finalPrice
        };
        setNewReceipt(prev => ({ ...prev, items: updatedItems }));
      }
    }
  };

  const generateReceipt = async () => {
    console.log('🔄 Έναρξη δημιουργίας απόδειξης...');
    console.log('📋 Στοιχεία απόδειξης:', newReceipt);
    
    if (!newReceipt.customerName || !newReceipt.items?.length) {
      console.log('❌ Λείπουν απαραίτητα στοιχεία');
      toast.error('Παρακαλώ συμπληρώστε τα απαραίτητα στοιχεία');
      return;
    }

    setLoading(true);
    console.log('⏳ Loading started...');
    try {
      // Ξεχωριστή αρίθμηση για ΑΠΥ και ΤΠΥ
      const samSeriesReceipts = receipts.filter(r => r.receiptNumber.startsWith(receiptSeries));
      const nextNumber = samSeriesReceipts.length + 1;
      const receiptNumber = `${receiptSeries}-${String(nextNumber).padStart(4, '0')}`;
      
      const subtotal = newReceipt.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
      const vat = newReceipt.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.vatRate / 100), 0) || 0;
      const total = subtotal + vat;

      const receipt: ReceiptData = {
        id: Date.now().toString(),
        receiptNumber,
        customerName: newReceipt.customerName!,
        customerVat: newReceipt.customerVat,
        customerEmail: newReceipt.customerEmail,
        items: newReceipt.items!,
        subtotal,
        vat,
        total,
        date: issueDate,
        myDataStatus: 'pending'
      };

      // Παίρνουμε το σωστό app_users.id από το auth.uid()
      const { data: { user } } = await supabase.auth.getUser();
      let createdBy = null;
      if (user?.id) {
        // Βρίσκουμε το app_users.id που αντιστοιχεί στο auth_user_id
        const { data: appUser } = await supabase
          .from('app_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (appUser?.id) {
          createdBy = appUser.id;
          
          // Αποθήκευση στη βάση με το σωστό app_users.id
          const { error: paymentError } = await supabase.from('payments').insert({
            user_id: appUser.id,
            amount: total,
            payment_method: 'Subscription',
            transaction_id: receiptNumber,
            status: 'completed'
          });

          if (paymentError) {
            console.error('Payment insert error:', paymentError);
          } else {
            console.log('✅ Payment saved successfully!');
          }
        }
      }

      // Αποθήκευση της απόδειξης στη βάση δεδομένων
      const { data: savedReceipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          receipt_number: receiptNumber,
          customer_name: receipt.customerName,
          customer_vat: receipt.customerVat,
          customer_email: receipt.customerEmail,
          items: receipt.items as any,  // Cast to any for JSON compatibility
          subtotal: receipt.subtotal,
          vat: receipt.vat,
          total: receipt.total,
          issue_date: receipt.date,
          mydata_status: receipt.myDataStatus,
          created_by: createdBy
        })
        .select()
        .single();

      if (receiptError) {
        console.error('❌ Receipt save error:', receiptError);
        throw new Error('Σφάλμα στην αποθήκευση της απόδειξης');
      }

      console.log('✅ Receipt saved to database:', savedReceipt);
      
      // Ενημέρωση local state με την αποθηκευμένη απόδειξη
      const finalReceipt = {
        ...receipt,
        id: savedReceipt.id
      };
      
      setReceipts(prev => [finalReceipt, ...prev]);
      
      // Αυτόματη αποστολή στο MyData
      try {
        await sendToMyData(finalReceipt);
        toast.success('Απόδειξη δημιουργήθηκε και στάλθηκε στο MyData!');
      } catch (mydataError) {
        console.error('MyData send error:', mydataError);
        toast.warning('Απόδειξη δημιουργήθηκε αλλά δεν στάλθηκε στο MyData. Δοκιμάστε ξανά.');
      }
      
      // Ξαναφορτώνουμε τις αποδείξεις για να έχουμε τα πιο πρόσφατα στοιχεία
      await loadReceipts();
      
      // Reset form
      setSelectedUser('');
      setSelectedSubscriptionType('');
      setNewReceipt({
        customerName: '',
        customerVat: '',
        customerEmail: '',
        items: [{
          id: '1',
          description: 'Premium Subscription',
          quantity: 1,
          unitPrice: 49.99,
          vatRate: 13,
          total: 56.49
        }]
      });

    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Σφάλμα στη δημιουργία απόδειξης');
    } finally {
      setLoading(false);
    }
  };

  const sendToMyData = async (receipt: ReceiptData) => {
    console.log('🚀 Έναρξη αποστολής στο MyData...');
    console.log('🔧 Settings:', settings);
    console.log('📄 Receipt data:', receipt);
    
    if (!settings.connected) {
      throw new Error('Δεν είστε συνδεδεμένοι στο MyData');
    }
    
    try {
      // Fix: Χρησιμοποιούμε το σωστό format για τον αριθμό απόδειξης
      const receiptNumberParts = receipt.receiptNumber.split('-');
      const series = receiptNumberParts[0] || 'A';
      const sequentialNumber = receiptNumberParts[1] || '1';
      
      console.log('📡 Καλώ το edge function mydata-send-receipt...');
      const { data, error } = await supabase.functions.invoke('mydata-send-receipt', {
        body: {
          aadeUserId: settings.aadeUserId,
          subscriptionKey: settings.subscriptionKey,
          environment: settings.environment,
          receipt: {
            issuer: {
              vatNumber: settings.aadeUserId, // Χρησιμοποιούμε το aadeUserId ως ΑΦΜ
              country: "GR",
              branch: 0
            },
            counterpart: {
              vatNumber: receipt.customerVat || "",
              country: "GR"
            },
            invoiceHeader: {
              series: series,
              aa: sequentialNumber, // Fix: Χρησιμοποιούμε τον σωστό αριθμό
              issueDate: receipt.date,
              invoiceType: receiptSeries === 'ΑΠΥ' ? "2.1" : "1.1", // ΑΠΥ ή ΤΠΥ
              currency: "EUR"
            },
            invoiceDetails: receipt.items.map((item, index) => ({
              lineNumber: index + 1,
              netValue: item.unitPrice * item.quantity,
              vatCategory: item.vatRate === 13 ? 7 : (item.vatRate === 24 ? 1 : 8), // VAT category mapping
              vatAmount: (item.unitPrice * item.quantity * item.vatRate / 100)
            })),
            invoiceSummary: {
              totalNetValue: receipt.subtotal,
              totalVatAmount: receipt.vat,
              totalWithheldAmount: 0,
              totalFeesAmount: 0,
              totalStampDutyAmount: 0,
              totalOtherTaxesAmount: 0,
              totalDeductionsAmount: 0,
              totalGrossValue: receipt.total
            }
          }
        }
      });

      console.log('📨 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('❌ MyData API error:', data?.error || 'Unknown error');
        const errorMsg = data?.error || 'Σφάλμα στην αποστολή στο MyData';
        throw new Error(errorMsg);
      }

      console.log('✅ MyData response successful:', data);

      // Update receipt status in database
      const { error: updateError } = await supabase
        .from('receipts')
        .update({
          mydata_status: 'sent',
          mydata_id: data?.myDataId || 'demo-id',
          invoice_mark: data?.invoiceMark
        })
        .eq('id', receipt.id);

      if (updateError) {
        console.error('❌ Error updating receipt status:', updateError);
      }

      // Update local state
      setReceipts(prev => prev.map(r => 
        r.id === receipt.id 
          ? { 
              ...r, 
              myDataStatus: 'sent', 
              myDataId: data?.myDataId || 'demo-id',
              invoiceMark: data?.invoiceMark // Αποθήκευση αριθμού ΜΑΡΚ από MyData
            }
          : r
      ));

      return data;
    } catch (error) {
      console.error('❌ MyData send error:', error);
      
      // Update receipt status to error in database
      const { error: updateError } = await supabase
        .from('receipts')
        .update({
          mydata_status: 'error'
        })
        .eq('id', receipt.id);

      if (updateError) {
        console.error('❌ Error updating receipt status to error:', updateError);
      }

      // Update local state
      setReceipts(prev => prev.map(r => 
        r.id === receipt.id 
          ? { ...r, myDataStatus: 'error' }
          : r
      ));
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#00ffba]" />
              Διαχείριση Αποδείξεων
              {settings.connected && <Badge className="bg-green-100 text-green-800">MyData Συνδεδεμένο</Badge>}
            </CardTitle>
            {settings.connected && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSettings(prev => ({ ...prev, connected: false }))}
                className="rounded-none"
              >
                Αποσύνδεση MyData
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none">
              <TabsTrigger value="history" className="rounded-none text-xs sm:text-sm px-2 sm:px-4 py-2">
                <span className="hidden sm:inline">Ιστορικό Αποδείξεων</span>
                <span className="sm:hidden">Ιστορικό</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="rounded-none text-xs sm:text-sm px-2 sm:px-4 py-2">
                <span className="hidden sm:inline">Νέα Απόδειξη</span>
                <span className="sm:hidden">Νέα</span>
              </TabsTrigger>
              <TabsTrigger value="mydata" className="rounded-none text-xs sm:text-sm px-2 sm:px-4 py-2">
                <span className="hidden sm:inline">MyData Ρυθμίσεις</span>
                <span className="sm:hidden">MyData</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Στοιχεία Απόδειξης</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Αριθμός Απόδειξης (Αυτόματος)</label>
                    <Input
                      value={`${receiptSeries}-${String(receipts.filter(r => r.receiptNumber.startsWith(receiptSeries)).length + 1).padStart(4, '0')}`}
                      disabled
                      className="rounded-none bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ΣΕΙΡΑ: ΑΠΥ/ΤΠΥ *</label>
                    <Select value={receiptSeries} onValueChange={(value: 'ΑΠΥ' | 'ΤΠΥ') => setReceiptSeries(value)}>
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ΑΠΥ">ΑΠΥ - Απόδειξη Παροχής Υπηρεσιών</SelectItem>
                        <SelectItem value="ΤΠΥ">ΤΠΥ - Τιμολόγιο Παροχής Υπηρεσιών</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Έκδοση *</label>
                    <Input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                </div>

                <h4 className="font-semibold">Στοιχεία Πελάτη</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Πελάτης *</label>
                    <Select value={selectedUser} onValueChange={handleUserSelect}>
                      <SelectTrigger className="rounded-none">
                        <SelectValue placeholder="Επιλέξτε πελάτη..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ΑΦΜ (προαιρετικό)</label>
                    <Input
                      value={newReceipt.customerVat}
                      onChange={(e) => setNewReceipt(prev => ({ ...prev, customerVat: e.target.value }))}
                      className="rounded-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Έναρξης</label>
                    <Input
                      type="date"
                      value={newReceipt.startDate}
                      onChange={(e) => setNewReceipt(prev => ({ ...prev, startDate: e.target.value }))}
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Λήξης</label>
                    <Input
                      type="date"
                      value={newReceipt.endDate}
                      onChange={(e) => setNewReceipt(prev => ({ ...prev, endDate: e.target.value }))}
                      className="rounded-none"
                    />
                  </div>
                </div>

                <h4 className="font-semibold">ΤΥΠΟΣ Συνδρομής</h4>
                {newReceipt.items?.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 p-4 rounded-none">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Τύπος Συνδρομής *</label>
                        <Select 
                          value={selectedSubscriptionType} 
                          onValueChange={handleSubscriptionTypeSelect}
                        >
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Επιλέξτε τύπο συνδρομής..." />
                          </SelectTrigger>
                          <SelectContent>
                            {subscriptionTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name} - €{type.price.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Ποσότητα</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const updatedItems = [...(newReceipt.items || [])];
                            const quantity = parseInt(e.target.value) || 1;
                            const finalPrice = item.total / (updatedItems[index]?.quantity || 1); // τιμή ανα τεμάχιο με ΦΠΑ
                            const totalPrice = finalPrice * quantity;
                            const netPrice = totalPrice / (1 + item.vatRate / 100);
                            
                            updatedItems[index] = { 
                              ...item, 
                              quantity,
                              unitPrice: netPrice / quantity, // καθαρή τιμή ανά τεμάχιο
                              total: totalPrice
                            };
                            setNewReceipt(prev => ({ ...prev, items: updatedItems }));
                          }}
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Τελική Τιμή (€) *</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(item.total / item.quantity).toFixed(2)}
                          onChange={(e) => {
                            const updatedItems = [...(newReceipt.items || [])];
                            const finalPricePerUnit = parseFloat(e.target.value) || 0;
                            const totalFinalPrice = finalPricePerUnit * item.quantity;
                            const netPrice = totalFinalPrice / (1 + item.vatRate / 100);
                            
                            updatedItems[index] = { 
                              ...item, 
                              unitPrice: netPrice / item.quantity,
                              total: totalFinalPrice
                            };
                            setNewReceipt(prev => ({ ...prev, items: updatedItems }));
                          }}
                          className="rounded-none"
                          placeholder="Τελική αξία με ΦΠΑ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ΦΠΑ (%)</label>
                        <Select value={item.vatRate.toString()} onValueChange={(value) => {
                          const updatedItems = [...(newReceipt.items || [])];
                          const vatRate = parseInt(value);
                          const currentFinalPrice = item.total;
                          const newNetPrice = currentFinalPrice / (1 + vatRate / 100);
                          
                          updatedItems[index] = { 
                            ...item, 
                            vatRate,
                            unitPrice: newNetPrice / item.quantity,
                            total: currentFinalPrice // διατηρούμε την τελική τιμή
                          };
                          setNewReceipt(prev => ({ ...prev, items: updatedItems }));
                        }}>
                          <SelectTrigger className="rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="6">6%</SelectItem>
                            <SelectItem value="13">13%</SelectItem>
                            <SelectItem value="24">24%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <span className="text-gray-600">Καθαρή Αξία:</span>
                        <p className="font-semibold">€{(item.unitPrice * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-600">ΦΠΑ ({item.vatRate}%):</span>
                        <p className="font-semibold">€{(item.unitPrice * item.quantity * item.vatRate / 100).toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-600">Τελική Αξία:</span>
                        <p className="font-bold text-[#00ffba]">€{item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-gray-50 p-4 border-l-4 border-[#00ffba] space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Αξία Συνδρομής:</span>
                    <span>€{newReceipt.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">ΦΠΑ:</span>
                    <span>€{newReceipt.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.vatRate / 100), 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-[#00ffba] pt-2">
                    <div className="flex justify-between text-xl font-bold text-[#00ffba]">
                      <span>Σύνολο:</span>
                      <span>€{newReceipt.items?.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={generateReceipt}
                    disabled={loading}
                    className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Έκδοση & Αποστολή στο MyData
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Ιστορικό Αποδείξεων</h4>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-[#00ffba] border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-600">Φόρτωση...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <div className="border border-gray-200 rounded-none overflow-hidden">
                        <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b font-medium text-sm">
                          <div>Αριθμός</div>
                          <div>Πελάτης</div>
                          <div>Ημερομηνία</div>
                          <div>Ποσό</div>
                          <div>Κατάσταση</div>
                          <div>Ενέργειες</div>
                        </div>
                        {receipts.map((receipt) => (
                          <div key={receipt.id} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-100 items-center">
                            <div>
                              <p className="font-medium">{receipt.receiptNumber}</p>
                              {receipt.invoiceMark && (
                                <p className="text-xs text-green-600 font-medium">ΜΑΡΚ: {receipt.invoiceMark}</p>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{receipt.customerName}</p>
                              {receipt.customerEmail && (
                                <p className="text-xs text-gray-500">{receipt.customerEmail}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm">{receipt.date}</p>
                            </div>
                            <div>
                              <p className="font-bold">€{receipt.total.toFixed(2)}</p>
                            </div>
                            <div>
                              <Badge className={`${getStatusColor(receipt.myDataStatus)} flex items-center gap-1`}>
                                {getStatusIcon(receipt.myDataStatus)}
                                {receipt.myDataStatus === 'sent' ? 'Εστάλη' : 
                                 receipt.myDataStatus === 'pending' ? 'Εκκρεμεί' : 'Σφάλμα'}
                              </Badge>
                              {receipt.myDataId && (
                                <p className="text-xs text-gray-500 mt-1">ID: {receipt.myDataId}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-none"
                                onClick={() => {
                                  setSelectedReceipt(receipt);
                                  setPreviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Προβολή
                              </Button>
                              {receipt.myDataStatus === 'error' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={async () => {
                                    try {
                                      setLoading(true);
                                      await sendToMyData(receipt);
                                      toast.success('Η απόδειξη στάλθηκε επιτυχώς στο MyData!');
                                    } catch (error) {
                                      console.error('Retry send error:', error);
                                      toast.error('Σφάλμα στην επανάληψη αποστολής');
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  disabled={loading}
                                  className="rounded-none"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  {loading ? 'Αποστολή...' : 'Επανάληψη'}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {receipts.map((receipt) => (
                        <div key={receipt.id} className="border border-gray-200 rounded-none bg-white overflow-hidden">
                          {/* Header with receipt number and amount */}
                          <div className="bg-gray-50 p-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-sm">{receipt.receiptNumber}</h5>
                                <p className="text-xs text-gray-500">{receipt.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-base">€{receipt.total.toFixed(2)}</p>
                                <Badge className={`${getStatusColor(receipt.myDataStatus)} text-xs`}>
                                  {getStatusIcon(receipt.myDataStatus)}
                                  <span className="ml-1">
                                    {receipt.myDataStatus === 'sent' ? 'Εστάλη' : 
                                     receipt.myDataStatus === 'pending' ? 'Εκκρεμεί' : 'Σφάλμα'}
                                  </span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="p-3 space-y-2">
                            <div>
                              <p className="font-medium text-sm">{receipt.customerName}</p>
                              {receipt.customerEmail && (
                                <p className="text-xs text-gray-500">{receipt.customerEmail}</p>
                              )}
                            </div>
                            
                            {(receipt.myDataId || receipt.invoiceMark) && (
                              <div className="space-y-1">
                                {receipt.myDataId && (
                                  <p className="text-xs text-gray-500">MyData ID: {receipt.myDataId}</p>
                                )}
                                {receipt.invoiceMark && (
                                  <p className="text-xs text-green-600 font-medium">ΜΑΡΚ: {receipt.invoiceMark}</p>
                                )}
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none flex-1 text-xs h-8"
                                  onClick={() => {
                                    setSelectedReceipt(receipt);
                                    setPreviewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Προβολή
                                </Button>
                                {receipt.myDataStatus === 'error' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={async () => {
                                      try {
                                        setLoading(true);
                                        await sendToMyData(receipt);
                                        toast.success('Η απόδειξη στάλθηκε επιτυχώς στο MyData!');
                                      } catch (error) {
                                        console.error('Retry send error:', error);
                                        toast.error('Σφάλμα στην επανάληψη αποστολής');
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    disabled={loading}
                                    className="rounded-none flex-1 text-xs h-8"
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    Επανάληψη
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="mydata" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Ρυθμίσεις MyData AADE</h4>
                
                {!settings.connected ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-2">AADE User ID</label>
                         <Input
                           placeholder="Εισάγετε το AADE User ID από το MyData portal"
                           value={settings.aadeUserId}
                           onChange={(e) => setSettings(prev => ({ ...prev, aadeUserId: e.target.value }))}
                           className="rounded-none"
                         />
                       </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Subscription Key</label>
                        <Input
                          type="password"
                          placeholder="Εισάγετε το Subscription Key"
                          value={settings.subscriptionKey}
                          onChange={(e) => setSettings(prev => ({ ...prev, subscriptionKey: e.target.value }))}
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Περιβάλλον</label>
                      <Select value={settings.environment} onValueChange={(value: 'development' | 'production') => setSettings(prev => ({ ...prev, environment: value }))}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development (Δοκιμαστικό)</SelectItem>
                          <SelectItem value="production">Production (Παραγωγή)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Περιβάλλον - ΜΟΝΟ ΠΑΡΑΓΩΓΗ</label>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-none">
                        <Badge className="bg-red-100 text-red-800">
                          Production (Παραγωγή) - ΜΟΝΟ
                        </Badge>
                      </div>
                    </div>

                    <Button 
                      onClick={handleConnect}
                      className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                    >
                      Σύνδεση με MyData
                    </Button>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-none">
                      <p className="text-sm text-blue-800">
                        ℹ️ Χρειάζεστε έγκυρο ΑΦΜ, Subscription Key από το MyData portal της AADE και τα στοιχεία σας από το TAXISnet για να στέλνετε παραστατικά.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-2">AADE User ID</label>
                         <Input value={settings.aadeUserId} disabled className="rounded-none bg-gray-50" />
                       </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Περιβάλλον</label>
                        <Badge className={settings.environment === 'production' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                          {settings.environment === 'production' ? 'Παραγωγή' : 'Δοκιμαστικό'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-none">
                      <h5 className="font-medium mb-2">Στατιστικά</h5>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-[#00ffba]">{receipts.length}</p>
                          <p className="text-sm text-gray-600">Συνολικές Αποδείξεις</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{receipts.filter(r => r.myDataStatus === 'sent').length}</p>
                          <p className="text-sm text-gray-600">Εσταλμένες</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-yellow-600">{receipts.filter(r => r.myDataStatus === 'pending').length}</p>
                          <p className="text-sm text-gray-600">Εκκρεμείς</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ReceiptPreviewDialog
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};
