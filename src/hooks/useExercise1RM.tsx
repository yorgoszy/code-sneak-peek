import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseExercise1RMProps {
  userId: string | null;
  exerciseId: string | null;
}

export const useExercise1RM = ({ userId, exerciseId }: UseExercise1RMProps) => {
  const [oneRM, setOneRM] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch1RM = async () => {
      if (!userId || !exerciseId) {
        setOneRM(null);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_exercise_1rm' as any)
          .select('weight')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('recorded_date', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching 1RM:', error);
          setOneRM(null);
        } else if (data) {
          setOneRM((data as any).weight);
        } else {
          setOneRM(null);
        }
      } catch (error) {
        console.error('Error fetching 1RM:', error);
        setOneRM(null);
      } finally {
        setLoading(false);
      }
    };

    fetch1RM();
  }, [userId, exerciseId]);

  return { oneRM, loading };
};
