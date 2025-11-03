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
        // 1) Πάρε την τελευταία session για τον χρήστη & την άσκηση και επίλεξε τη μέγιστη προσπάθεια αυτής της session
        const { data, error } = await supabase
          .from('strength_test_attempts')
          .select(`
            id,
            weight_kg,
            created_at,
            strength_test_sessions!inner (
              test_date,
              user_id
            )
          `)
          .eq('strength_test_sessions.user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('strength_test_sessions.test_date', { ascending: false })
          .order('created_at', { ascending: false })
          .order('weight_kg', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching 1RM from Force/Velocity:', error);
        }

        if (data && (data as any).weight_kg) {
          console.log('✅ 1RM από Force/Velocity:', (data as any).weight_kg, 'kg');
          setOneRM((data as any).weight_kg);
          return;
        }

        // 2) Fallback: αν δεν βρεθούν attempts, δοκίμασε τον πίνακα user_exercise_1rm
        console.log('ℹ️ Δεν βρέθηκαν Force/Velocity attempts, δοκιμή fallback user_exercise_1rm...');
        const { data: fallback, error: fallbackError } = await supabase
          .from('user_exercise_1rm' as any)
          .select('weight')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('recorded_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackError) {
          console.error('❌ Fallback error fetching 1RM:', fallbackError);
          setOneRM(null);
        } else if (fallback) {
          console.log('✅ 1RM από user_exercise_1rm:', (fallback as any).weight, 'kg');
          setOneRM((fallback as any).weight);
        } else {
          console.log('⚠️ Δεν βρέθηκε 1RM ούτε στα Force/Velocity ούτε στο user_exercise_1rm');
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
