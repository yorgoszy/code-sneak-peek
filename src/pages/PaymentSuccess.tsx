import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, ArrowLeft, Receipt, AlertCircle, Calendar } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarSection } from "@/components/programs/builder/CalendarSection";
import type { ProgramStructure } from "@/components/programs/builder/hooks/useProgramBuilderState";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProgramCalendar, setShowProgramCalendar] = useState(false);
  const [programData, setProgramData] = useState<any>(null);
  const [calendarProgram, setCalendarProgram] = useState<ProgramStructure>({
    id: '',
    name: '',
    description: '',
    user_id: '',
    user_ids: [],
    is_multiple_assignment: false,
    training_dates: [],
    weeks: []
  });

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
        await checkForProgramSubscription(data.payment_id);
        
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

  const checkForProgramSubscription = async (paymentId: string) => {
    try {
      // Λήψη του payment για να πάρουμε το subscription_type_id
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select(`
          subscription_type_id,
          subscription_types (
            program_id,
            programs (
              id,
              name,
              description,
              program_weeks (
                id,
                name,
                week_number,
                program_days (
                  id,
                  name,
                  day_number
                )
              )
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        console.log('No payment found or error:', paymentError);
        return;
      }

      const subscriptionType = payment.subscription_types;
      if (subscriptionType?.program_id && subscriptionType.programs) {
        console.log('Found program subscription:', subscriptionType.programs);
        setProgramData(subscriptionType.programs);
        
        // Μετατροπή σε ProgramStructure format
        const program = subscriptionType.programs;
        const weeks = program.program_weeks?.map((week: any) => ({
          id: week.id,
          name: week.name,
          week_number: week.week_number,
          program_days: week.program_days?.map((day: any) => ({
            id: day.id,
            name: day.name,
            day_number: day.day_number,
            program_blocks: []
          })) || []
        })) || [];

        setCalendarProgram({
          id: program.id,
          name: program.name,
          description: program.description || '',
          user_id: '',
          user_ids: [],
          is_multiple_assignment: false,
          training_dates: [],
          weeks: weeks
        });
        
        setShowProgramCalendar(true);
      }
    } catch (error) {
      console.error('Error checking for program subscription:', error);
    }
  };

  const getTotalTrainingDays = () => {
    return calendarProgram.weeks.reduce((total, week) => total + (week.program_days?.length || 0), 0);
  };

  const handleTrainingDatesChange = (dates: Date[]) => {
    setCalendarProgram(prev => ({
      ...prev,
      training_dates: dates
    }));
  };

  const handleSaveProgramDates = async () => {
    try {
      if (calendarProgram.training_dates.length === 0) {
        toast.error('Παρακαλώ επιλέξτε ημερομηνίες προπόνησης');
        return;
      }

      // Αποθήκευση των ημερομηνιών στη βάση δεδομένων
      const trainingDates = calendarProgram.training_dates.map(date => 
        date instanceof Date ? date.toISOString().split('T')[0] : date
      );

      // Δημιουργία program assignment
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No authenticated user');

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', currentUser.user.id)
        .single();

      if (!appUser) throw new Error('App user not found');

      const assignmentData = {
        program_id: calendarProgram.id,
        user_id: appUser.id,
        training_dates: trainingDates,
        status: 'active',
        assigned_at: new Date().toISOString()
      };

      const { error: assignmentError } = await supabase
        .from('program_assignments')
        .insert(assignmentData);

      if (assignmentError) {
        throw new Error(`Failed to create assignment: ${assignmentError.message}`);
      }

      toast.success('Οι ημερομηνίες προπόνησης αποθηκεύτηκαν με επιτυχία!');
      setShowProgramCalendar(false);
    } catch (error) {
      console.error('Error saving program dates:', error);
      toast.error('Σφάλμα κατά την αποθήκευση των ημερομηνιών');
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

      {/* Program Calendar Dialog */}
      <Dialog open={showProgramCalendar} onOpenChange={setShowProgramCalendar}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Επιλογή Ημερομηνιών Προπόνησης - {programData?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-none border border-blue-200">
              <p className="text-sm text-blue-700">
                Παρακαλώ επιλέξτε τις ημερομηνίες που θέλετε να κάνετε προπόνηση. 
                Χρειάζεστε {getTotalTrainingDays()} ημερομηνίες συνολικά.
              </p>
            </div>

            {getTotalTrainingDays() > 0 && (
              <CalendarSection
                program={calendarProgram}
                totalDays={getTotalTrainingDays()}
                onTrainingDatesChange={handleTrainingDatesChange}
              />
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowProgramCalendar(false)}
                className="rounded-none"
              >
                Αργότερα
              </Button>
              <Button
                onClick={handleSaveProgramDates}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                disabled={calendarProgram.training_dates.length !== getTotalTrainingDays()}
              >
                Αποθήκευση Ημερομηνιών
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSuccess;