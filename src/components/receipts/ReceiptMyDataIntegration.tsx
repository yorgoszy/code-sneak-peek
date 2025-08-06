import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Receipt {
  id: string;
  receipt_number: string;
  user_id: string;
  total: number;
  net_amount: number;
  tax_amount: number;
  issue_date: string;
  mydata_status?: 'pending' | 'sent' | 'error';
  mydata_id?: string;
  invoice_mark?: string;
}

interface ReceiptMyDataIntegrationProps {
  receipt: Receipt;
  onUpdate: () => void;
}

export const ReceiptMyDataIntegration: React.FC<ReceiptMyDataIntegrationProps> = ({ 
  receipt, 
  onUpdate 
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const getMyDataSettings = () => {
    return {
      aadeUserId: localStorage.getItem('mydata_aade_user_id') || '',
      subscriptionKey: localStorage.getItem('mydata_subscription_key') || '',
      vatNumber: localStorage.getItem('mydata_vat_number') || '',
      environment: (localStorage.getItem('mydata_environment') as 'development' | 'production') || 'development',
      enabled: localStorage.getItem('mydata_enabled') === 'true'
    };
  };

  const sendToMyData = async () => {
    const settings = getMyDataSettings();
    
    if (!settings.enabled) {
      toast({
        title: "MyData μη ενεργό",
        description: "Η ενσωμάτωση MyData δεν είναι ενεργοποιημένη",
        variant: "destructive"
      });
      return;
    }

    if (!settings.aadeUserId || !settings.subscriptionKey || !settings.vatNumber) {
      toast({
        title: "Μη ολοκληρωμένες ρυθμίσεις",
        description: "Παρακαλώ ολοκληρώστε τις ρυθμίσεις MyData πρώτα",
        variant: "destructive"
      });
      return;
    }

    setSending(true);

    try {
      // Δημιουργία MyData receipt format
      const myDataReceipt = {
        issuer: {
          vatNumber: settings.vatNumber,
          country: "GR",
          branch: 0
        },
        counterpart: {
          vatNumber: "000000000", // Απόδειξη λιανικής - δεν απαιτείται ΑΦΜ πελάτη
          country: "GR",
          branch: 0
        },
        invoiceHeader: {
          series: "A",
          aa: parseInt(receipt.receipt_number) || Math.floor(Math.random() * 100000),
          issueDate: receipt.issue_date,
          invoiceType: "11.1", // Απόδειξη Λιανικής Πώλησης
          currency: "EUR"
        },
        invoiceDetails: [{
          lineNumber: 1,
          netValue: receipt.net_amount,
          vatCategory: 1, // ΦΠΑ 24%
          vatAmount: receipt.tax_amount
        }],
        invoiceSummary: {
          totalNetValue: receipt.net_amount,
          totalVatAmount: receipt.tax_amount,
          totalWithheldAmount: 0,
          totalFeesAmount: 0,
          totalStampDutyAmount: 0,
          totalOtherTaxesAmount: 0,
          totalDeductionsAmount: 0,
          totalGrossValue: receipt.total
        }
      };

      console.log('🚀 Sending receipt to MyData:', {
        receiptId: receipt.id,
        receiptNumber: receipt.receipt_number,
        environment: settings.environment
      });

      // Κλήση του edge function
      const { data, error } = await supabase.functions.invoke('mydata-send-receipt', {
        body: {
          aadeUserId: settings.aadeUserId,
          subscriptionKey: settings.subscriptionKey,
          environment: settings.environment,
          receipt: myDataReceipt
        }
      });

      if (error) {
        console.error('❌ MyData API error:', error);
        throw error;
      }

      if (data.success) {
        // Ενημέρωση της απόδειξης στη βάση δεδομένων
        const { error: updateError } = await supabase
          .from('receipts')
          .update({
            mydata_status: 'sent',
            mydata_id: data.myDataId,
            invoice_mark: data.invoiceMark,
            updated_at: new Date().toISOString()
          })
          .eq('id', receipt.id);

        if (updateError) {
          console.error('❌ Database update error:', updateError);
          throw updateError;
        }

        toast({
          title: "Επιτυχής αποστολή",
          description: `Απόδειξη στάλθηκε στο MyData. ΜΑΡΚ: ${data.invoiceMark}`,
        });

        onUpdate();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('❌ MyData send error:', error);
      
      // Ενημέρωση κατάστασης σε error
      await supabase
        .from('receipts')
        .update({
          mydata_status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', receipt.id);

      toast({
        title: "Σφάλμα αποστολής",
        description: error.message || "Σφάλμα κατά την αποστολή στο MyData",
        variant: "destructive"
      });

      onUpdate();
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = () => {
    switch (receipt.mydata_status) {
      case 'sent':
        return (
          <Badge className="bg-[#00ffba] text-black rounded-none">
            <CheckCircle className="w-3 h-3 mr-1" />
            Στάλθηκε
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="rounded-none">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Σφάλμα
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="secondary" className="rounded-none">
            Εκκρεμεί
          </Badge>
        );
    }
  };

  const settings = getMyDataSettings();

  return (
    <div className="flex items-center gap-3">
      {getStatusBadge()}
      
      {receipt.invoice_mark && (
        <div className="text-xs text-gray-600">
          ΜΑΡΚ: {receipt.invoice_mark}
        </div>
      )}

      {receipt.mydata_status !== 'sent' && settings.enabled && (
        <Button
          onClick={sendToMyData}
          disabled={sending}
          size="sm"
          variant="outline"
          className="rounded-none"
        >
          {sending ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Send className="w-3 h-3 mr-1" />
          )}
          {sending ? "Αποστολή..." : "Αποστολή MyData"}
        </Button>
      )}

      {!settings.enabled && (
        <Button
          onClick={() => window.location.href = '/dashboard/subscriptions'}
          size="sm"
          variant="ghost"
          className="text-xs text-gray-500 rounded-none"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Ενεργοποίηση MyData
        </Button>
      )}
    </div>
  );
};