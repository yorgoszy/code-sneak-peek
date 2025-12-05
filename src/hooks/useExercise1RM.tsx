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
    // ΑΜΕΣΑ reset το 1RM όταν αλλάζουν τα dependencies
    // Αυτό διασφαλίζει ότι το παλιό 1RM δεν χρησιμοποιείται
    setOneRM(null);
    
    const fetch1RM = async () => {
      console.log('🔍 useExercise1RM - userId:', userId, 'exerciseId:', exerciseId);
      
      if (!userId || !exerciseId) {
        console.log('⚠️ useExercise1RM - Missing userId or exerciseId');
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('🔄 Fetching 1RM from user_exercise_1rm table...');
      
      try {
        const { data, error } = await supabase
          .from('user_exercise_1rm' as any)
          .select('weight')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('recorded_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching 1RM:', error);
          setOneRM(null);
        } else if (data) {
          console.log('✅ Found 1RM:', (data as any).weight, 'kg');
          setOneRM((data as any).weight);
        } else {
          console.log('⚠️ No 1RM found for this user/exercise combination');
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
