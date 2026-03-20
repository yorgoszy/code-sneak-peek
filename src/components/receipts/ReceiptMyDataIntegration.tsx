import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateReceiptPDF } from "@/utils/pdfGenerator";

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

  // Extract series (e.g., "ΑΠΥ" from "ΑΠΥ-0060")
  const extractSeriesFromReceiptNumber = (receiptNumber: string): string => {
    const match = receiptNumber.match(/^([A-ZΑ-Ω]+)/i);
    return match ? match[1] : 'A';
  };

  // Extract number (e.g., 60 from "ΑΠΥ-0060")
  const extractNumberFromReceiptNumber = (receiptNumber: string): number => {
    const match = receiptNumber.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : Math.floor(Math.random() * 100000);
  };

  const getMyDataSettings = () => {
    // Clean up any legacy localStorage credentials (security fix)
    localStorage.removeItem('mydata_aade_user_id');
    localStorage.removeItem('mydata_subscription_key');
    localStorage.removeItem('mydata_vat_number');

    return {
      // Credentials are now always fetched server-side from mydata_settings table
      // via the mydata-send-receipt edge function
      aadeUserId: '',
      subscriptionKey: '',
      vatNumber: '',
      environment: 'production' as const,
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

    // Always use server-side credentials from mydata_settings table
    const useStoredCredentials = true;
    console.log('🔑 Using stored Supabase secrets for MyData credentials');

    setSending(true);

    try {
      // Δημιουργία MyData receipt format
      const myDataReceipt = {
        issuer: {
          vatNumber: settings.vatNumber || '', // Θα ληφθεί από secrets αν είναι κενό
          country: "GR",
          branch: 0
        },
        counterpart: {
          vatNumber: "000000000", // Απόδειξη λιανικής - δεν απαιτείται ΑΦΜ πελάτη
          country: "GR",
          branch: 0
        },
        invoiceHeader: {
          series: extractSeriesFromReceiptNumber(receipt.receipt_number),
          aa: extractNumberFromReceiptNumber(receipt.receipt_number),
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
        environment: settings.environment,
        useStoredCredentials
      });

      // Κλήση του edge function - μπορεί να χρησιμοποιήσει stored secrets
      const { data, error } = await supabase.functions.invoke('mydata-send-receipt', {
        body: {
          aadeUserId: useStoredCredentials ? undefined : settings.aadeUserId,
          subscriptionKey: useStoredCredentials ? undefined : settings.subscriptionKey,
          environment: settings.environment,
          receipt: myDataReceipt,
          useStoredCredentials
        }
      });

      if (error) {
        console.error('❌ MyData API error:', error);
        throw error;
      }

      if (data.success) {
        // Ενημέρωση της απόδειξης στη βάση δεδομένων με όλα τα MyData στοιχεία
        const { error: updateError } = await supabase
          .from('receipts')
          .update({
            mydata_status: 'sent',
            mydata_id: data.myDataId,
            invoice_mark: data.invoiceMark,
            invoice_uid: data.invoiceUid,
            qr_url: data.qrUrl,
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

        // Δημιουργία PDF και αποστολή email
        console.log('📧 Δημιουργία PDF για αποστολή email...');
        const pdfBase64 = await generateReceiptPDF('receipt-content');
        
        if (pdfBase64) {
          console.log('📧 Αποστολή email notification με PDF για απόδειξη:', receipt.id);
          const { error: emailError } = await supabase.functions.invoke('send-subscription-receipt', {
            body: {
              type: 'receipt_notification',
              receiptId: receipt.id,
              pdfBase64: pdfBase64
            }
          });

          if (emailError) {
            console.error('❌ Σφάλμα αποστολής email:', emailError);
            // Δεν σταματάμε τη διαδικασία αν αποτύχει το email
          } else {
            console.log('✅ Email notification με PDF στάλθηκε επιτυχώς');
          }
        } else {
          console.error('❌ Αποτυχία δημιουργίας PDF');
        }

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