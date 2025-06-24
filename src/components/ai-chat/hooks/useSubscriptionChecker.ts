
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionStatus } from './types';

interface UseSubscriptionCheckerProps {
  isOpen: boolean;
  userId?: string;
}

export const useSubscriptionChecker = ({ isOpen, userId }: UseSubscriptionCheckerProps): SubscriptionStatus => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      checkSubscriptionStatus();
    }
  }, [isOpen, userId]);

  const checkSubscriptionStatus = async () => {
    if (!userId) {
      console.log('❌ useSubscriptionChecker: No userId provided');
      setHasActiveSubscription(false);
      setIsCheckingSubscription(false);
      return;
    }
    
    setIsCheckingSubscription(true);
    try {
      console.log('🔍 useSubscriptionChecker: Checking subscription for user:', userId);
      
      // Έλεγχος του subscription_status για τον συγκεκριμένο χρήστη
      const { data: userProfile, error: profileError } = await supabase
        .from('app_users')
        .select('role, subscription_status')
        .eq('id', userId)  // Ελέγχουμε τον συγκεκριμένο χρήστη
        .single();

      if (profileError) {
        console.error('❌ useSubscriptionChecker: Error fetching user profile:', profileError);
        setHasActiveSubscription(false);
        setIsCheckingSubscription(false);
        return;
      }

      console.log('📊 useSubscriptionChecker: User profile:', userProfile);

      // Αν είναι admin, δίνουμε πρόσβαση
      if (userProfile?.role === 'admin') {
        console.log('✅ useSubscriptionChecker: Admin user detected - access granted');
        setHasActiveSubscription(true);
        setIsCheckingSubscription(false);
        return;
      }

      // Έλεγχος του subscription_status για τον συγκεκριμένο χρήστη
      const hasSubscription = userProfile?.subscription_status === 'active';
      console.log('🎯 useSubscriptionChecker: Final subscription decision:', hasSubscription);
      setHasActiveSubscription(hasSubscription);
    } catch (error) {
      console.error('💥 useSubscriptionChecker: Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  return { hasActiveSubscription, isCheckingSubscription };
};
