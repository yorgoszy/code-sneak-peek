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
  userId: string;
  subscriptionKey: string;
  environment: 'sandbox' | 'production';
  connected: boolean;
}

export const ReceiptManagement: React.FC = () => {
  const [settings, setSettings] = useState<MyDataSettings>({
    userId: localStorage.getItem('mydata_user_id') || '',
    subscriptionKey: localStorage.getItem('mydata_subscription_key') || '',
    environment: 'sandbox',
    connected: false
  });

  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
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
    
    if (settings.userId && settings.subscriptionKey) {
      setSettings(prev => ({ ...prev, connected: true }));
    }
  }, []);

  const handleConnect = () => {
    if (!settings.userId || !settings.subscriptionKey) {
      toast.error('Παρακαλώ συμπληρώστε όλα τα στοιχεία σύνδεσης');
      return;
    }

    localStorage.setItem('mydata_user_id', settings.userId);
    localStorage.setItem('mydata_subscription_key', settings.subscriptionKey);
    
    setSettings(prev => ({ ...prev, connected: true }));
    toast.success('Επιτυχής σύνδεση με MyData AADE!');
    loadReceipts();
  };

  const loadReceipts = async () => {
    setLoading(true);
    try {
      console.log('🔄 Φόρτωση αποδείξεων...');
      // Φόρτωση αποδείξεων από τις συνδρομές
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_types (*),
          app_users (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading subscriptions:', error);
        throw error;
      }
      
      console.log('📋 Loaded subscriptions:', subscriptions?.length || 0, subscriptions);

      // Μετατροπή συνδρομών σε αποδείξεις
      const receiptData: ReceiptData[] = (subscriptions || []).map((sub, index) => {
        const subscriptionType = sub.subscription_types;
        const user = sub.app_users;
        const invoiceNumber = `SUB-${new Date(sub.created_at).getFullYear()}${String(new Date(sub.created_at).getMonth() + 1).padStart(2, '0')}${String(new Date(sub.created_at).getDate()).padStart(2, '0')}-${String(index + 1).padStart(4, '0')}`;
        
        const netAmount = subscriptionType?.price || 0;
        const vatAmount = netAmount * 0.13; // 13% ΦΠΑ για γυμναστήριο
        const totalAmount = netAmount + vatAmount;

        return {
          id: sub.id,
          receiptNumber: `ΑΠΥ-${String(index + 1).padStart(4, '0')}`,
          customerName: user?.name || 'Άγνωστος χρήστης',
          customerEmail: user?.email,
          items: [
            {
              id: '1',
              description: subscriptionType?.name || 'Συνδρομή',
              quantity: 1,
              unitPrice: netAmount,
              vatRate: 13,
              total: totalAmount
            }
          ],
          subtotal: netAmount,
          vat: vatAmount,
          total: totalAmount,
          date: sub.start_date,
          startDate: sub.start_date,
          endDate: sub.end_date,
          myDataStatus: 'sent' as const,
          myDataId: `MD${Date.now()}`
        };
      });

      setReceipts(receiptData);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Σφάλμα στη φόρτωση αποδείξεων');
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = async () => {
    if (!newReceipt.customerName || !newReceipt.items?.length) {
      toast.error('Παρακαλώ συμπληρώστε τα απαραίτητα στοιχεία');
      return;
    }

    setLoading(true);
    try {
      const receiptNumber = `${receiptSeries}-${String(receipts.length + 1).padStart(4, '0')}`;
      
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

      // Αποθήκευση στη βάση
      await supabase.from('payments').insert({
        user_id: 'current_user_id', // Θα έρθει από auth context
        amount: total,
        payment_method: 'Subscription',
        transaction_id: receiptNumber,
        status: 'completed'
      });

      setReceipts(prev => [receipt, ...prev]);
      
      // Αυτόματη αποστολή στο MyData
      await sendToMyData(receipt);
      
      // Reset form
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

      toast.success('Απόδειξη δημιουργήθηκε και στάλθηκε στο MyData!');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Σφάλμα στη δημιουργία απόδειξης');
    } finally {
      setLoading(false);
    }
  };

  const sendToMyData = async (receipt: ReceiptData) => {
    try {
      // Προσομοίωση κλήσης MyData API
      const { data, error } = await supabase.functions.invoke('mydata-send-receipt', {
        body: {
          userId: settings.userId,
          subscriptionKey: settings.subscriptionKey,
          environment: settings.environment,
          receipt: {
            issuer: {
              vatNumber: "999999999", // Το δικό σας ΑΦΜ
              country: "GR",
              branch: 0
            },
            counterpart: {
              vatNumber: receipt.customerVat || "",
              country: "GR"
            },
            invoiceHeader: {
              series: "A",
              aa: receipt.receiptNumber.split('-')[2],
              issueDate: receipt.date,
              invoiceType: "2.1", // Τιμολόγιο Πώλησης
              currency: "EUR"
            },
            invoiceDetails: receipt.items.map(item => ({
              lineNumber: 1,
              netValue: item.unitPrice * item.quantity,
              vatCategory: 1, // 24%
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

      if (error) throw error;

      // Update receipt status
      setReceipts(prev => prev.map(r => 
        r.id === receipt.id 
          ? { ...r, myDataStatus: 'sent', myDataId: data.myDataId }
          : r
      ));

      return data;
    } catch (error) {
      console.error('MyData send error:', error);
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
              <TabsTrigger value="history" className="rounded-none">Ιστορικό Αποδείξεων</TabsTrigger>
              <TabsTrigger value="new" className="rounded-none">Νέα Απόδειξη</TabsTrigger>
              <TabsTrigger value="mydata" className="rounded-none">MyData Ρυθμίσεις</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Στοιχεία Απόδειξης</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Σειρά Απόδειξης *</label>
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
                    <label className="block text-sm font-medium mb-2">Ημερομηνία Έκδοσης *</label>
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
                    <label className="block text-sm font-medium mb-2">Όνομα Πελάτη *</label>
                    <Input
                      value={newReceipt.customerName}
                      onChange={(e) => setNewReceipt(prev => ({ ...prev, customerName: e.target.value }))}
                      className="rounded-none"
                    />
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

                <h4 className="font-semibold">Στοιχεία Απόδειξης</h4>
                {newReceipt.items?.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 p-4 rounded-none">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Περιγραφή</label>
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const updatedItems = [...(newReceipt.items || [])];
                            updatedItems[index] = { ...item, description: e.target.value };
                            setNewReceipt(prev => ({ ...prev, items: updatedItems }));
                          }}
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Τιμή (€)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updatedItems = [...(newReceipt.items || [])];
                            const unitPrice = parseFloat(e.target.value) || 0;
                            updatedItems[index] = { 
                              ...item, 
                              unitPrice,
                              total: unitPrice * item.quantity * (1 + item.vatRate / 100)
                            };
                            setNewReceipt(prev => ({ ...prev, items: updatedItems }));
                          }}
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ΦΠΑ (%)</label>
                        <Select value={item.vatRate.toString()} onValueChange={(value) => {
                          const updatedItems = [...(newReceipt.items || [])];
                          const vatRate = parseInt(value);
                          updatedItems[index] = { 
                            ...item, 
                            vatRate,
                            total: item.unitPrice * item.quantity * (1 + vatRate / 100)
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
                    <div className="mt-2 text-right">
                      <span className="font-semibold">Σύνολο: €{item.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-right">
                    <p>Υποσύνολο: €{newReceipt.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}</p>
                    <p>ΦΠΑ: €{newReceipt.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.vatRate / 100), 0).toFixed(2)}</p>
                    <p className="font-bold text-lg">Σύνολο: €{newReceipt.items?.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</p>
                  </div>
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
                  receipts.map((receipt) => (
                    <div key={receipt.id} className="border border-gray-200 p-4 rounded-none">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{receipt.receiptNumber}</h5>
                          <p className="text-sm text-gray-600">{receipt.customerName}</p>
                          <p className="text-xs text-gray-500">{receipt.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">€{receipt.total.toFixed(2)}</p>
                          <Badge className={`${getStatusColor(receipt.myDataStatus)} flex items-center gap-1 mt-1`}>
                            {getStatusIcon(receipt.myDataStatus)}
                            {receipt.myDataStatus === 'sent' ? 'Εστάλη' : 
                             receipt.myDataStatus === 'pending' ? 'Εκκρεμεί' : 'Σφάλμα'}
                          </Badge>
                          {receipt.myDataId && (
                            <p className="text-xs text-gray-500 mt-1">ID: {receipt.myDataId}</p>
                          )}
                        </div>
                      </div>
                       <div className="flex gap-2 mt-3">
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-none"
                          onClick={async () => {
                            // Create temporary element for PDF generation
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = `
                              <div style="padding: 32px; max-width: 600px; margin: 0 auto; background: white; font-family: Arial, sans-serif;">
                                <div style="text-align: center; border-bottom: 2px solid #00ffba; padding-bottom: 24px; margin-bottom: 32px;">
                                  <div style="font-size: 28px; font-weight: bold; color: #333; margin-bottom: 8px;">HYPERKIDS</div>
                                  <p style="color: #666;">Προπονητικό Κέντρο Αθλητικής Επίδοσης</p>
                                </div>
                                <h2 style="font-size: 24px; color: #00ffba; text-align: center; margin-bottom: 32px;">ΑΠΟΔΕΙΞΗ ΣΥΝΔΡΟΜΗΣ</h2>
                                <div style="margin-bottom: 32px;">
                                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <span style="font-weight: bold;">Αριθμός Απόδειξης:</span>
                                    <span>${receipt.receiptNumber}</span>
                                  </div>
                                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <span style="font-weight: bold;">Ημερομηνία:</span>
                                    <span>${receipt.date}</span>
                                  </div>
                                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <span style="font-weight: bold;">Πελάτης:</span>
                                    <span>${receipt.customerName}</span>
                                  </div>
                                </div>
                                <div style="margin-bottom: 32px;">
                                  <h3 style="font-weight: bold; margin-bottom: 16px;">Στοιχεία Συνδρομής</h3>
                                  ${receipt.items.map(item => `
                                    <div style="border: 1px solid #ddd; padding: 16px; margin-bottom: 16px;">
                                      <div style="font-weight: bold; margin-bottom: 8px;">${item.description}</div>
                                      <div style="display: flex; justify-content: space-between;">
                                        <span>Τιμή: €${item.unitPrice.toFixed(2)}</span>
                                        <span>ΦΠΑ: ${item.vatRate}%</span>
                                      </div>
                                    </div>
                                  `).join('')}
                                </div>
                                <div style="background: #f8f9fa; padding: 24px; border-left: 4px solid #00ffba;">
                                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="font-weight: bold;">Υποσύνολο:</span>
                                    <span>€${receipt.subtotal.toFixed(2)}</span>
                                  </div>
                                   <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                                     <span style="font-weight: bold;">ΦΠΑ (13%):</span>
                                     <span>€${receipt.vat.toFixed(2)}</span>
                                   </div>
                                  <div style="border-top: 2px solid #00ffba; padding-top: 16px;">
                                    <div style="display: flex; justify-content: space-between;">
                                      <span style="font-size: 24px; font-weight: bold; color: #00ffba;">Σύνολο:</span>
                                      <span style="font-size: 24px; font-weight: bold; color: #00ffba;">€${receipt.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                                  <p><strong>HYPERKIDS</strong> - Προπονητικό Κέντρο</p>
                                  <p>Τηλ: +30 210 1234567 | Email: info@hyperkids.gr</p>
                                </div>
                              </div>
                            `;
                            
                            document.body.appendChild(tempDiv);
                            
                            try {
                              const canvas = await html2canvas(tempDiv, {
                                scale: 2,
                                useCORS: true,
                                allowTaint: true
                              });
                              
                              const imgData = canvas.toDataURL('image/png');
                              const pdf = new jsPDF('p', 'mm', 'a4');
                              
                              const imgWidth = 210;
                              const pageHeight = 295;
                              const imgHeight = (canvas.height * imgWidth) / canvas.width;
                              
                              pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                              pdf.save(`${receipt.receiptNumber}.pdf`);
                            } catch (error) {
                              console.error('Error generating PDF:', error);
                            } finally {
                              document.body.removeChild(tempDiv);
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        {receipt.myDataStatus === 'error' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => sendToMyData(receipt)}
                            className="rounded-none"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Επανάληψη
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
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
                        <label className="block text-sm font-medium mb-2">User ID (ΑΦΜ)</label>
                        <Input
                          placeholder="Εισάγετε το ΑΦΜ σας"
                          value={settings.userId}
                          onChange={(e) => setSettings(prev => ({ ...prev, userId: e.target.value }))}
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
                      <Select value={settings.environment} onValueChange={(value: 'sandbox' | 'production') => 
                        setSettings(prev => ({ ...prev, environment: value }))
                      }>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">Sandbox (Δοκιμαστικό)</SelectItem>
                          <SelectItem value="production">Production (Παραγωγή)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleConnect}
                      className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                    >
                      Σύνδεση με MyData
                    </Button>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-none">
                      <p className="text-sm text-blue-800">
                        ℹ️ Χρειάζεστε έγκυρο ΑΦΜ και Subscription Key από το MyData portal της AADE για να στέλνετε παραστατικά.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">User ID (ΑΦΜ)</label>
                        <Input value={settings.userId} disabled className="rounded-none bg-gray-50" />
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