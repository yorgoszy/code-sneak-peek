import { supabase } from '@/integrations/supabase/client';

export interface WarmUpExercise {
  exercise_id: string;
  exercise_name: string;
  exercise_type: 'stretching' | 'strengthening';
  muscle_name: string;
  body_region: 'upper' | 'lower';
}

// Cache for warm-up exercises by user ID
const warmUpCache = new Map<string, { exercises: WarmUpExercise[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Mapping muscles to body regions
const UPPER_BODY_MUSCLES = [
  'τραπεζ', 'ωμοπλάτ', 'θωρακ', 'ραχιαίος', 'αυχεν', 'κεφαλ', 'οδοντ',
  'ρομβοειδ', 'σκαλην', 'στερνοκλειδ', 'υπακάνθ', 'υποπλάτ', 'στρογγύλ',
  'ώμου', 'βραχιον', 'δικέφαλ', 'τρικέφαλ', 'πήχ', 'καρπ',
  'ανελκτήρ'
];

const LOWER_BODY_MUSCLES = [
  'γλουτ', 'τετρακέφαλ', 'δικέφαλ μηρ', 'γαστροκν', 'κνήμ', 'μηρ',
  'λαγον', 'ψοΐτ', 'καμπτήρ', 'προσαγ', 'απαγ', 'πελμ', 'ποδ',
  'ισχι'
];

const getMuscleBodyRegion = (muscleName: string): 'upper' | 'lower' => {
  const lowerName = muscleName.toLowerCase();
  
  // Check for lower body first (more specific)
  for (const keyword of LOWER_BODY_MUSCLES) {
    if (lowerName.includes(keyword.toLowerCase())) {
      return 'lower';
    }
  }
  
  // Default to upper body for remaining muscles
  return 'upper';
};

/**
 * Pre-fetch and cache warm-up exercises for an athlete
 * Call this when selecting a user to avoid delays
 */
export const prefetchAthleteWarmUpExercises = async (userId: string): Promise<void> => {
  if (!userId) return;
  await fetchAthleteWarmUpExercises(userId);
};

/**
 * Get cached warm-up exercises synchronously (returns empty if not cached)
 */
export const getCachedWarmUpExercises = (userId: string): WarmUpExercise[] | null => {
  const cached = warmUpCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.exercises;
  }
  return null;
};

/**
 * Clear cache for a specific user or all users
 */
export const clearWarmUpCache = (userId?: string): void => {
  if (userId) {
    warmUpCache.delete(userId);
  } else {
    warmUpCache.clear();
  }
};

/**
 * Fetches warm up exercises for an athlete based on their functional test muscles
 * Gets the latest functional test data and finds linked exercises from functional_muscle_exercises
 * Uses caching to avoid repeated database calls
 */
export const fetchAthleteWarmUpExercises = async (userId: string): Promise<WarmUpExercise[]> => {
  if (!userId) return [];

  // Check cache first
  const cached = warmUpCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('🚀 Using cached warm-up exercises for:', userId);
    return cached.exercises;
  }

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
      warmUpCache.set(userId, { exercises: [], timestamp: Date.now() });
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
      warmUpCache.set(userId, { exercises: [], timestamp: Date.now() });
      return [];
    }

    const stretchMuscles: string[] = testData.muscles_need_stretching || [];
    const strengthenMuscles: string[] = testData.muscles_need_strengthening || [];
    const allMuscles = [...new Set([...stretchMuscles, ...strengthenMuscles])];

    if (allMuscles.length === 0) {
      console.log('No muscles found in functional test data');
      warmUpCache.set(userId, { exercises: [], timestamp: Date.now() });
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
      warmUpCache.set(userId, { exercises: [], timestamp: Date.now() });
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
          muscle_name: link.muscle_name,
          body_region: getMuscleBodyRegion(link.muscle_name)
        });
      }
    });

    const result = Array.from(exerciseMap.values());
    console.log('🏋️ Fetched and cached warm up exercises for athlete:', result.length);
    
    // Cache the result
    warmUpCache.set(userId, { exercises: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    console.error('Error fetching athlete warm up exercises:', error);
    return [];
  }
};
