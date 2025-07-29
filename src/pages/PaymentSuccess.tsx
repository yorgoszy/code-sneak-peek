import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Receipt, AlertCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgramCalendarDialog } from "@/components/programs/ProgramCalendarDialog";
import { useProgramCalendarDialog } from "@/hooks/useProgramCalendarDialog";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
    isOpen: showProgramCalendar,
    programId,
    checkAndShowProgramCalendarFromPayment,
    close: closeProgramCalendar
  } = useProgramCalendarDialog();

  useEffect(() => {
    if (sessionId && !processed && !processing) {
      processPayment();
    }
  }, [sessionId, processed, processing]);

  const processPayment = async () => {
    if (!sessionId) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      console.log('🔄 Processing payment success for session:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('process-payment-success', {
        body: { session_id: sessionId }
      });

      if (error) {
        console.error('❌ Error processing payment:', error);
        throw error;
      }

      if (data?.success) {
        console.log('✅ Payment processed successfully:', data);
        setReceiptNumber(data.receipt_number);
        setProcessed(true);
        
        // Έλεγχος αν είναι συνδρομή με πρόγραμμα
        if (data.payment_id) {
          await checkAndShowProgramCalendarFromPayment(data.payment_id);
        }
        
        toast.success('Η πληρωμή επεξεργάστηκε με επιτυχία!');
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('💥 Error processing payment:', error);
      setError(error instanceof Error ? error.message : 'Σφάλμα επεξεργασίας πληρωμής');
      toast.error('Σφάλμα κατά την επεξεργασία της πληρωμής');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full rounded-none">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-[#00ffba]" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Επιτυχής Πληρωμή!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {processing ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffba] mx-auto"></div>
              <p className="text-gray-600">Επεξεργάζεται η πληρωμή σας...</p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={processPayment}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                Επανάληψη
              </Button>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                Η πληρωμή σου ολοκληρώθηκε με επιτυχία. Θα λάβεις email επιβεβαίωσης σύντομα.
              </p>

              {receiptNumber && (
                <div className="bg-green-50 p-4 rounded-none border border-green-200">
                  <p className="text-sm text-green-700 mb-1">Αριθμός Απόδειξης:</p>
                  <p className="text-sm font-mono text-green-800 font-semibold">{receiptNumber}</p>
                </div>
              )}

              {sessionId && (
                <div className="bg-gray-50 p-4 rounded-none border">
                  <p className="text-sm text-gray-500 mb-1">ID Συναλλαγής:</p>
                  <p className="text-xs font-mono text-gray-700 break-all">{sessionId}</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Τι ακολουθεί:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 text-left">
                  <li>• Η απόδειξη αποθηκεύτηκε στον λογαριασμό σας</li>
                  <li>• Μπορείτε να τη δείτε στις πληρωμές του προφίλ σας</li>
                  <li>• Η συνδρομή/υπηρεσία ενεργοποιήθηκε</li>
                </ul>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button 
              asChild 
              variant="outline" 
              className="flex-1 rounded-none"
            >
              <Link to="/shop">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Πίσω στις Αγορές
              </Link>
            </Button>
            
            <Button 
              asChild 
              className="flex-1 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <Link to="/dashboard">
                <Receipt className="w-4 h-4 mr-2" />
                Προφίλ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProgramCalendarDialog
        isOpen={showProgramCalendar}
        onClose={closeProgramCalendar}
        programId={programId}
      />
    </div>
  );
};

export default PaymentSuccess;