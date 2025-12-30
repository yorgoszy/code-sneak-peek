import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseExercise1RMProps {
  userId: string | null;
  exerciseId: string | null;
}

export const useExercise1RM = ({ userId, exerciseId }: UseExercise1RMProps) => {
  const [oneRM, setOneRM] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceExerciseId, setSourceExerciseId] = useState<string | null>(null);

  useEffect(() => {
    // ΑΜΕΣΑ reset το 1RM όταν αλλάζουν τα dependencies
    setOneRM(null);
    setSourceExerciseId(null);
    
    const fetch1RM = async () => {
      console.log('🔍 useExercise1RM - userId:', userId, 'exerciseId:', exerciseId);
      
      if (!userId || !exerciseId) {
        console.log('⚠️ useExercise1RM - Missing userId or exerciseId');
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Πρώτα ψάχνουμε 1RM για την τρέχουσα άσκηση
        const { data: directData, error: directError } = await supabase
          .from('user_exercise_1rm' as any)
          .select('weight')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('recorded_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (directError) {
          console.error('❌ Error fetching direct 1RM:', directError);
        } else if (directData) {
          console.log('✅ Found direct 1RM:', (directData as any).weight, 'kg');
          setOneRM((directData as any).weight);
          setSourceExerciseId(exerciseId);
          setLoading(false);
          return;
        }

        // Αν δεν βρέθηκε, ψάχνουμε στις συνδεδεμένες ασκήσεις
        console.log('🔗 Searching in linked exercises...');
        
        // Βρίσκουμε τις συνδεδεμένες ασκήσεις ΜΟΝΟ τύπου strength_variant (από το ExerciseLinkDialog)
        const { data: relationships, error: relError } = await supabase
          .from('exercise_relationships')
          .select('exercise_id, related_exercise_id')
          .eq('relationship_type', 'strength_variant')
          .or(`exercise_id.eq.${exerciseId},related_exercise_id.eq.${exerciseId}`);

        if (relError) {
          console.error('❌ Error fetching relationships:', relError);
          setLoading(false);
          return;
        }

        if (!relationships || relationships.length === 0) {
          console.log('⚠️ No linked exercises found');
          setLoading(false);
          return;
        }

        // Συλλέγουμε όλα τα συνδεδεμένα exercise IDs
        const linkedExerciseIds = relationships.map(rel => 
          rel.exercise_id === exerciseId ? rel.related_exercise_id : rel.exercise_id
        );
        
        console.log('🔗 Found linked exercises:', linkedExerciseIds);

        // Ψάχνουμε 1RM σε οποιαδήποτε από τις συνδεδεμένες ασκήσεις
        const { data: linkedData, error: linkedError } = await supabase
          .from('user_exercise_1rm' as any)
          .select('weight, exercise_id')
          .eq('user_id', userId)
          .in('exercise_id', linkedExerciseIds)
          .order('recorded_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (linkedError) {
          console.error('❌ Error fetching linked 1RM:', linkedError);
        } else if (linkedData) {
          console.log('✅ Found 1RM from linked exercise:', (linkedData as any).weight, 'kg');
          setOneRM((linkedData as any).weight);
          setSourceExerciseId((linkedData as any).exercise_id);
        } else {
          console.log('⚠️ No 1RM found in linked exercises');
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

  return { oneRM, loading, sourceExerciseId };
};
