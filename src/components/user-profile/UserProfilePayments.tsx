
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReceiptPreviewDialog } from "@/components/analytics/ReceiptPreviewDialog";

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

export const UserProfilePayments = ({ payments, userProfile }: UserProfilePaymentsProps) => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      loadUserReceipts();
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

  return (
    <>
      <div className="space-y-6">
        {/* Ιστορικό Αποδείξεων που έχουν κοπεί */}
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Ιστορικό Αποδείξεων
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="space-y-3">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="border border-gray-200 p-4 rounded-none hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{receipt.receipt_number}</h4>
                          <Badge className={`text-xs ${getStatusColor(receipt.mydata_status)}`}>
                            {getStatusText(receipt.mydata_status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{receipt.customer_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ημερομηνία: {formatDate(receipt.issue_date)}
                        </p>
                        <p className="text-lg font-bold text-[#00ffba] mt-2">
                          €{receipt.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReceipt(receipt)}
                          className="rounded-none"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
          myDataId: selectedReceipt.mydata_id
        } : null}
      />
    </>
  );
};
