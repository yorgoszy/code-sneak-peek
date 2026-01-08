import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FmsStatus = 'red' | 'yellow' | 'green' | null;

interface FmsExerciseMapping {
  exercise_id: string;
  status: FmsStatus;
  fms_exercise: string;
}

interface UseFmsExerciseStatusResult {
  exerciseStatusMap: Map<string, FmsStatus>;
  loading: boolean;
  userFmsScores: Record<string, number> | null;
}

// FMS scores: 1 = red (problem), 2 = yellow (caution), 3 = green (ok)
const getFmsStatusFromScore = (score: number): FmsStatus => {
  if (score <= 1) return 'red';
  if (score === 2) return 'yellow';
  return 'green';
};

export const useFmsExerciseStatus = (userId: string | null): UseFmsExerciseStatusResult => {
  const [loading, setLoading] = useState(false);
  const [userFmsScores, setUserFmsScores] = useState<Record<string, number> | null>(null);
  const [fmsMappings, setFmsMappings] = useState<FmsExerciseMapping[]>([]);

  useEffect(() => {
    if (!userId) {
      setUserFmsScores(null);
      setFmsMappings([]);
      return;
    }

    const fetchFmsData = async () => {
      setLoading(true);
      try {
        // 1. Get the latest FMS test for the user from both tables
        let latestFmsScores: Record<string, number> | null = null;
        
        // Try functional_test_sessions first
        const { data: regularSession } = await supabase
          .from('functional_test_sessions')
          .select('id, test_date')
          .eq('user_id', userId)
          .order('test_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Also try coach_functional_test_sessions
        const { data: coachSession } = await supabase
          .from('coach_functional_test_sessions')
          .select('id, test_date')
          .eq('user_id', userId)
          .order('test_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Determine which session is most recent
        let sessionToUse: { id: string; test_date: string; isCoach: boolean } | null = null;
        
        if (regularSession && coachSession) {
          const regularDate = new Date(regularSession.test_date);
          const coachDate = new Date(coachSession.test_date);
          sessionToUse = regularDate >= coachDate 
            ? { ...regularSession, isCoach: false }
            : { ...coachSession, isCoach: true };
        } else if (regularSession) {
          sessionToUse = { ...regularSession, isCoach: false };
        } else if (coachSession) {
          sessionToUse = { ...coachSession, isCoach: true };
        }

        if (sessionToUse) {
          // Fetch FMS data from the appropriate table
          const tableName = sessionToUse.isCoach ? 'coach_functional_test_data' : 'functional_test_data';
          const { data: fmsData } = await supabase
            .from(tableName)
            .select('fms_detailed_scores')
            .eq('test_session_id', sessionToUse.id)
            .maybeSingle();

          if (fmsData?.fms_detailed_scores) {
            latestFmsScores = fmsData.fms_detailed_scores as Record<string, number>;
          }
        }

        setUserFmsScores(latestFmsScores);

        // 2. Fetch all FMS exercise mappings with pagination
        const pageSize = 1000;
        let from = 0;
        let allMappings: FmsExerciseMapping[] = [];

        while (true) {
          const { data: mappings, error } = await supabase
            .from('fms_exercise_mappings')
            .select('exercise_id, status, fms_exercise')
            .range(from, from + pageSize - 1);

          if (error) {
            console.error('Error fetching FMS mappings:', error);
            break;
          }

          const batch = (mappings || []) as FmsExerciseMapping[];
          allMappings = allMappings.concat(batch);

          if (batch.length < pageSize) break;
          from += pageSize;
        }

        setFmsMappings(allMappings);
        console.log('📊 FMS data loaded:', { userId, fmsScores: latestFmsScores, mappingsCount: allMappings.length });
      } catch (error) {
        console.error('Error fetching FMS exercise status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFmsData();
  }, [userId]);

  // Build the exercise status map based on user's FMS scores
  const exerciseStatusMap = useMemo(() => {
    const statusMap = new Map<string, FmsStatus>();

    if (!userFmsScores || fmsMappings.length === 0) {
      return statusMap;
    }

    // Normalize FMS exercise names for matching
    const normalizeKey = (key: string) => key.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Create a map of normalized FMS exercise names to their scores
    const normalizedScores: Record<string, number> = {};
    for (const [key, value] of Object.entries(userFmsScores)) {
      // Handle L/R variants - use the minimum score
      const baseName = key.replace(/ [LR]$/, '');
      const normalizedBase = normalizeKey(baseName);
      
      if (normalizedScores[normalizedBase] === undefined) {
        normalizedScores[normalizedBase] = value;
      } else {
        // Use the minimum score (worst case)
        normalizedScores[normalizedBase] = Math.min(normalizedScores[normalizedBase], value);
      }
    }

    console.log('📊 Normalized FMS scores:', normalizedScores);

    // For each mapping, determine the status based on user's FMS score
    for (const mapping of fmsMappings) {
      const normalizedFmsExercise = normalizeKey(mapping.fms_exercise);
      const userScore = normalizedScores[normalizedFmsExercise];

      if (userScore !== undefined) {
        // Only mark as red/yellow if user has a low score for this FMS exercise
        // AND the exercise is NOT marked as green in the mapping
        const scoreStatus = getFmsStatusFromScore(userScore);
        
        if (scoreStatus === 'red' || scoreStatus === 'yellow') {
          // If mapping says red/yellow (exercise is contraindicated), use mapping status
          // If mapping says green (exercise is good for this FMS), don't mark it
          if (mapping.status === 'red' || mapping.status === 'yellow') {
            // Use the worse status between score status and mapping status
            const currentStatus = statusMap.get(mapping.exercise_id);
            const newStatus = mapping.status;
            
            if (!currentStatus || 
                (currentStatus === 'yellow' && newStatus === 'red') ||
                (currentStatus === 'green' && (newStatus === 'red' || newStatus === 'yellow'))) {
              statusMap.set(mapping.exercise_id, newStatus);
            }
          }
        }
      }
    }

    console.log('📊 Exercise status map:', statusMap.size, 'exercises marked');
    return statusMap;
  }, [userFmsScores, fmsMappings]);

  return { exerciseStatusMap, loading, userFmsScores };
};
