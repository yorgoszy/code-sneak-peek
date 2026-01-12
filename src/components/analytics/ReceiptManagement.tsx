import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Receipt, 
  Send, 
  Loader2, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Plus, 
  Trash2,
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReceiptPreviewDialog } from "./ReceiptPreviewDialog";
import { ReceiptMyDataIntegration } from "@/components/receipts/ReceiptMyDataIntegration";
import { MyDataSettings } from "@/components/admin/MyDataSettings";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// MarkInput component
const MarkInput: React.FC<{
  receiptId: string;
  currentMark: string;
  onUpdate: () => void;
}> = ({ receiptId, currentMark, onUpdate }) => {
  const [mark, setMark] = useState(currentMark);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateMark = async () => {
    if (mark === currentMark) return;
    
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('receipts')
        .update({ invoice_mark: mark.trim() || null })
        .eq('id', receiptId);

      if (error) throw error;
      
      toast.success('Το ΜΑΡΚ ενημερώθηκε επιτυχώς!');
      onUpdate();
    } catch (error) {
      console.error('Error updating mark:', error);
      toast.error('Σφάλμα κατά την ενημέρωση του ΜΑΡΚ');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex gap-1">
      <Input
        value={mark}
        onChange={(e) => setMark(e.target.value)}
        placeholder="Εισάγετε ΜΑΡΚ"
        className="rounded-none text-xs h-8 flex-1"
        disabled={isUpdating}
      />
      <Button
        onClick={updateMark}
        size="sm"
        disabled={isUpdating || mark === currentMark}
        className="rounded-none h-8 px-2"
        variant="outline"
      >
        {isUpdating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
};

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
  invoiceMark?: string;
}

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

interface Settings {
  connected: boolean;
  aadeUserId: string;
  subscriptionKey: string;
}

export const ReceiptManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    connected: false,
    aadeUserId: '',
    subscriptionKey: ''
  });
  
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<ReceiptData | null>(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      
      const { data: receiptsData, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading receipts:', error);
        toast.error('Σφάλμα κατά τη φόρτωση των αποδείξεων');
        return;
      }

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
      toast.error('Σφάλμα κατά τη φόρτωση των αποδείξεων');
    } finally {
      setLoading(false);
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
      case 'sent': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'error': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;

    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receiptToDelete.id);

      if (error) throw error;

      toast.success('Η απόδειξη διαγράφηκε επιτυχώς');
      loadReceipts();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της απόδειξης');
    } finally {
      setReceiptToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Διαχείριση Αποδείξεων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none">
              <TabsTrigger value="history" className="rounded-none">Ιστορικό Αποδείξεων</TabsTrigger>
              <TabsTrigger value="mydata" className="rounded-none">Ρυθμίσεις MyData</TabsTrigger>
              <Button
                onClick={() => window.open('https://mydata.aade.gr/timologio/Account/Login?culture=el-GR', '_blank')}
                variant="outline"
                size="sm"
                className="rounded-none whitespace-nowrap text-xs sm:text-sm"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                E-timologio
              </Button>
            </TabsList>
            
            <TabsContent value="history" className="mt-4 sm:mt-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm sm:text-base">Ιστορικό Αποδείξεων</h4>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-[#00ffba] border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-600">Φόρτωση...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <div className="border border-gray-200 rounded-none overflow-hidden">
                        <div className="grid grid-cols-6 gap-4 p-3 sm:p-4 bg-gray-50 border-b font-medium text-xs sm:text-sm">
                          <div>Αριθμός</div>
                          <div>Πελάτης</div>
                          <div>Ημερομηνία</div>
                          <div>Ποσό</div>
                          <div>ΜΑΡΚ</div>
                          <div>Ενέργειες</div>
                        </div>
                        {receipts.map((receipt) => (
                          <div key={receipt.id} className="grid grid-cols-6 gap-4 p-3 sm:p-4 border-b border-gray-100 items-center">
                            <div>
                              <p className="font-medium text-xs sm:text-sm">{receipt.receiptNumber}</p>
                            </div>
                            <div>
                              <p className="font-medium text-xs sm:text-sm truncate">{receipt.customerName}</p>
                              {receipt.customerEmail && (
                                <p className="text-xs text-gray-500 truncate">{receipt.customerEmail}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm">{receipt.date}</p>
                            </div>
                            <div>
                              <p className="font-bold text-xs sm:text-sm">€{receipt.total.toFixed(2)}</p>
                            </div>
                            <div>
                              <MarkInput 
                                receiptId={receipt.id}
                                currentMark={receipt.invoiceMark || ''}
                                onUpdate={loadReceipts}
                              />
                            </div>
                            <div className="flex gap-1 sm:gap-2 items-center">
                              {receipt.invoiceMark && (
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-[#00ffba]" />
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-none text-xs px-1 sm:px-2"
                                onClick={() => {
                                  setSelectedReceipt(receipt);
                                  setPreviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Προβολή</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-none text-xs px-1 sm:px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setReceiptToDelete(receipt);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tablet Card View */}
                    <div className="hidden md:block lg:hidden space-y-3">
                      {receipts.map((receipt) => (
                        <div key={receipt.id} className="border border-gray-200 rounded-none bg-white overflow-hidden">
                          <div className="bg-gray-50 p-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-sm">{receipt.receiptNumber}</h5>
                                <p className="text-xs text-gray-500">{receipt.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-base">€{receipt.total.toFixed(2)}</p>
                                {receipt.invoiceMark && (
                                  <p className="text-xs text-green-600 font-medium">ΜΑΡΚ: {receipt.invoiceMark}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 space-y-2">
                            <div>
                              <p className="font-medium text-sm">{receipt.customerName}</p>
                              {receipt.customerEmail && (
                                <p className="text-xs text-gray-500">{receipt.customerEmail}</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2 items-center pt-2 border-t border-gray-100">
                              <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1">ΜΑΡΚ:</label>
                                <MarkInput 
                                  receiptId={receipt.id}
                                  currentMark={receipt.invoiceMark || ''}
                                  onUpdate={loadReceipts}
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-none mt-4"
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
                                className="rounded-none mt-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setReceiptToDelete(receipt);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {receipts.map((receipt) => (
                        <div key={receipt.id} className="border border-gray-200 rounded-none bg-white overflow-hidden">
                          <div className="bg-gray-50 p-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-sm">{receipt.receiptNumber}</h5>
                                <p className="text-xs text-gray-500">{receipt.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-base">€{receipt.total.toFixed(2)}</p>
                                {receipt.invoiceMark && (
                                  <p className="text-xs text-green-600 font-medium">ΜΑΡΚ: {receipt.invoiceMark}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 space-y-2">
                            <div>
                              <p className="font-medium text-sm">{receipt.customerName}</p>
                              {receipt.customerEmail && (
                                <p className="text-xs text-gray-500">{receipt.customerEmail}</p>
                              )}
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100 space-y-2">
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">ΜΑΡΚ:</label>
                                <MarkInput 
                                  receiptId={receipt.id}
                                  currentMark={receipt.invoiceMark || ''}
                                  onUpdate={loadReceipts}
                                />
                              </div>
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
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-none text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setReceiptToDelete(receipt);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
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
            
            <TabsContent value="mydata" className="mt-4 sm:mt-6">
              <MyDataSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Receipt Preview Dialog */}
      <ReceiptPreviewDialog
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        receipt={selectedReceipt ? {
          id: selectedReceipt.id,
          receiptNumber: selectedReceipt.receiptNumber,
          customerName: selectedReceipt.customerName,
          customerVat: selectedReceipt.customerVat,
          customerEmail: selectedReceipt.customerEmail,
          items: selectedReceipt.items,
          subtotal: selectedReceipt.subtotal,
          vat: selectedReceipt.vat,
          total: selectedReceipt.total,
          date: selectedReceipt.date,
          startDate: selectedReceipt.startDate,
          endDate: selectedReceipt.endDate,
          myDataStatus: selectedReceipt.myDataStatus,
          myDataId: selectedReceipt.myDataId,
          invoiceMark: selectedReceipt.invoiceMark
        } : null}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setReceiptToDelete(null);
        }}
        onConfirm={handleDeleteReceipt}
        title="Διαγραφή Απόδειξης"
        description={`Είστε σίγουροι ότι θέλετε να διαγράψετε την απόδειξη ${receiptToDelete?.receiptNumber}; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.`}
        confirmText="Διαγραφή"
        cancelText="Ακύρωση"
      />
    </div>
  );
};