
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLatest1RM = (userId: string, exerciseId: string) => {
  const [latest1RM, setLatest1RM] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetch1RM = async () => {
      if (!userId || !exerciseId) {
        setLatest1RM(null);
        return;
      }

      setIsLoading(true);
      try {
        // Βρίσκουμε το πιο πρόσφατο 1RM για αυτόν τον ασκούμενο και άσκηση
        const { data, error } = await supabase
          .from('strength_test_attempts')
          .select(`
            weight_kg,
            strength_test_sessions!inner(
              user_id,
              test_date
            )
          `)
          .eq('exercise_id', exerciseId)
          .eq('strength_test_sessions.user_id', userId)
          .eq('is_1rm', true)
          .order('strength_test_sessions(test_date)', { ascending: false })
          .order('weight_kg', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching 1RM:', error);
          setLatest1RM(null);
        } else if (data) {
          setLatest1RM(data.weight_kg);
        } else {
          setLatest1RM(null);
        }
      } catch (error) {
        console.error('Error fetching 1RM:', error);
        setLatest1RM(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetch1RM();
  }, [userId, exerciseId]);

  return { latest1RM, isLoading };
};
