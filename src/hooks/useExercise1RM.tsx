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
      console.log('🔍 useExercise1RM - userId:', userId, 'exerciseId:', exerciseId);
      
      if (!userId || !exerciseId) {
        console.log('⚠️ useExercise1RM - Missing userId or exerciseId');
        setOneRM(null);
        return;
      }

      setLoading(true);
      console.log('🔄 Fetching 1RM from Force/Velocity tests...');
      
      try {
        // Διαβάζω απευθείας από strength_test_attempts
        const { data, error } = await supabase
          .from('strength_test_attempts')
          .select(`
            weight_kg,
            strength_test_sessions!inner (
              test_date,
              user_id
            )
          `)
          .eq('strength_test_sessions.user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('strength_test_sessions.test_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching 1RM from Force/Velocity:', error);
          setOneRM(null);
        } else if (data) {
          console.log('✅ Found 1RM from Force/Velocity:', (data as any).weight_kg, 'kg');
          setOneRM((data as any).weight_kg);
        } else {
          console.log('⚠️ No Force/Velocity data found for this user/exercise combination');
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
