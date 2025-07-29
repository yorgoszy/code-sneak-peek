import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useProgramCalendarDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [programId, setProgramId] = useState<string | null>(null);

  const checkAndShowProgramCalendar = useCallback(async (subscriptionTypeId: string, paymentId?: string) => {
    try {
      console.log('🔍 Checking for program subscription:', subscriptionTypeId);

      // Λήψη του subscription type για να δούμε αν έχει program_id
      const { data: subscriptionType, error } = await supabase
        .from('subscription_types')
        .select(`
          program_id,
          programs (
            id,
            name
          )
        `)
        .eq('id', subscriptionTypeId)
        .single();

      if (error || !subscriptionType) {
        console.log('No subscription type found or error:', error);
        return false;
      }

      if (subscriptionType.program_id && subscriptionType.programs) {
        console.log('✅ Found program subscription:', subscriptionType.programs);
        setProgramId(subscriptionType.program_id);
        setIsOpen(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for program subscription:', error);
      return false;
    }
  }, []);

  const checkAndShowProgramCalendarFromPayment = useCallback(async (paymentId: string) => {
    try {
      console.log('🔍 Checking payment for program subscription:', paymentId);

      // Λήψη του payment για να πάρουμε το subscription_type_id
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select(`
          subscription_type_id,
          subscription_types (
            program_id,
            programs (
              id,
              name
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        console.log('No payment found or error:', paymentError);
        return false;
      }

      const subscriptionType = payment.subscription_types;
      if (subscriptionType?.program_id && subscriptionType.programs) {
        console.log('✅ Found program subscription from payment:', subscriptionType.programs);
        setProgramId(subscriptionType.program_id);
        setIsOpen(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking payment for program subscription:', error);
      return false;
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setProgramId(null);
  }, []);

  return {
    isOpen,
    programId,
    checkAndShowProgramCalendar,
    checkAndShowProgramCalendarFromPayment,
    close
  };
};