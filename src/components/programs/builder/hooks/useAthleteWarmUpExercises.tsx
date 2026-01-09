import { supabase } from '@/integrations/supabase/client';

export interface WarmUpExercise {
  exercise_id: string;
  exercise_name: string;
  exercise_type: 'stretching' | 'strengthening';
  muscle_name: string;
}

/**
 * Fetches warm up exercises for an athlete based on their functional test muscles
 * Gets the latest functional test data and finds linked exercises from functional_muscle_exercises
 */
export const fetchAthleteWarmUpExercises = async (userId: string): Promise<WarmUpExercise[]> => {
  if (!userId) return [];

  try {
    // Step 1: Get the latest functional test session for this user
    const { data: sessionData, error: sessionError } = await supabase
      .from('functional_test_sessions')
      .select('id')
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError || !sessionData) {
      console.log('No functional test session found for user:', userId);
      return [];
    }

    // Step 2: Get the functional test data with muscles
    const { data: testData, error: testError } = await supabase
      .from('functional_test_data')
      .select('muscles_need_strengthening, muscles_need_stretching')
      .eq('test_session_id', sessionData.id)
      .maybeSingle();

    if (testError || !testData) {
      console.log('No functional test data found for session:', sessionData.id);
      return [];
    }

    const stretchMuscles: string[] = testData.muscles_need_stretching || [];
    const strengthenMuscles: string[] = testData.muscles_need_strengthening || [];
    const allMuscles = [...new Set([...stretchMuscles, ...strengthenMuscles])];

    if (allMuscles.length === 0) {
      console.log('No muscles found in functional test data');
      return [];
    }

    // Step 3: Get linked exercises from functional_muscle_exercises
    const { data: linkedExercises, error: linkError } = await supabase
      .from('functional_muscle_exercises')
      .select(`
        muscle_name,
        exercise_id,
        exercise_type,
        exercises:exercise_id (
          id,
          name
        )
      `)
      .in('muscle_name', allMuscles);

    if (linkError || !linkedExercises) {
      console.log('No linked exercises found:', linkError);
      return [];
    }

    // Step 4: Transform to WarmUpExercise array (deduplicate by exercise_id)
    const exerciseMap = new Map<string, WarmUpExercise>();
    
    linkedExercises.forEach((link: any) => {
      if (link.exercises && !exerciseMap.has(link.exercise_id)) {
        exerciseMap.set(link.exercise_id, {
          exercise_id: link.exercise_id,
          exercise_name: link.exercises.name,
          exercise_type: link.exercise_type,
          muscle_name: link.muscle_name
        });
      }
    });

    const result = Array.from(exerciseMap.values());
    console.log('🏋️ Found warm up exercises for athlete:', result.length);
    return result;
  } catch (error) {
    console.error('Error fetching athlete warm up exercises:', error);
    return [];
  }
};
