
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StrengthData {
  exerciseId: string;
  weight1RM: number;
  testDate: string;
}

export const useStrengthData = (userId?: string) => {
  const [strengthData, setStrengthData] = useState<StrengthData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchStrengthData = async () => {
      setIsLoading(true);
      try {
        console.log('🏋️‍♂️ Fetching strength data for user:', userId);
        
        const { data, error } = await supabase
          .from('strength_test_attempts')
          .select(`
            exercise_id,
            weight_kg,
            strength_test_sessions!inner(
              user_id,
              test_date
            )
          `)
          .eq('strength_test_sessions.user_id', userId)
          .eq('is_1rm', true)
          .order('strength_test_sessions(test_date)', { ascending: false });

        if (error) {
          console.error('❌ Error fetching strength data:', error);
          return;
        }

        console.log('📊 Raw strength data:', data);

        // Κρατάμε μόνο το πιο πρόσφατο 1RM για κάθε άσκηση
        const latestData: StrengthData[] = [];
        const seenExercises = new Set();

        data?.forEach((attempt: any) => {
          if (!seenExercises.has(attempt.exercise_id)) {
            latestData.push({
              exerciseId: attempt.exercise_id,
              weight1RM: attempt.weight_kg,
              testDate: attempt.strength_test_sessions.test_date
            });
            seenExercises.add(attempt.exercise_id);
          }
        });

        console.log('✅ Processed strength data:', latestData);
        setStrengthData(latestData);
      } catch (error) {
        console.error('❌ Error fetching strength data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStrengthData();
  }, [userId]);

  const get1RM = (exerciseId: string): number | null => {
    const data = strengthData.find(item => item.exerciseId === exerciseId);
    const result = data ? data.weight1RM : null;
    console.log(`🎯 get1RM for exercise ${exerciseId}:`, result);
    return result;
  };

  const calculatePercentage = (exerciseId: string, weight: number): number | null => {
    const oneRM = get1RM(exerciseId);
    if (!oneRM || oneRM === 0) return null;
    const percentage = Math.round((weight / oneRM) * 100);
    console.log(`📊 calculatePercentage: ${weight}kg / ${oneRM}kg = ${percentage}%`);
    return percentage;
  };

  const calculateWeight = (exerciseId: string, percentage: number): number | null => {
    const oneRM = get1RM(exerciseId);
    if (!oneRM) return null;
    const weight = Math.round((oneRM * percentage / 100) * 2) / 2; // Round to nearest 0.5kg
    console.log(`⚖️ calculateWeight: ${oneRM}kg * ${percentage}% = ${weight}kg`);
    return weight;
  };

  return {
    strengthData,
    isLoading,
    get1RM,
    calculatePercentage,
    calculateWeight
  };
};
