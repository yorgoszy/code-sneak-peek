import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CoachSubscriptionStatus {
  isActive: boolean;
  subscriptionEndDate: string | null;
  isLoading: boolean;
}

export const useCoachSubscriptionStatus = (coachId?: string): CoachSubscriptionStatus => {
  const [isActive, setIsActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!coachId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('is_active, subscription_end_date')
        .eq('coach_id', coachId)
        .single();

      if (error) {
        console.error('Error fetching coach subscription status:', error);
        setIsActive(false);
        setSubscriptionEndDate(null);
      } else {
        // Check if subscription is still active (not expired)
        const isSubscriptionActive = data?.is_active === true;
        const endDate = data?.subscription_end_date;
        
        // If there's an end date, check if it's in the future
        if (endDate) {
          const isNotExpired = new Date(endDate) > new Date();
          setIsActive(isSubscriptionActive && isNotExpired);
        } else {
          setIsActive(isSubscriptionActive);
        }
        
        setSubscriptionEndDate(endDate);
      }
    } catch (error) {
      console.error('Error in fetchStatus:', error);
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { isActive, subscriptionEndDate, isLoading };
};
