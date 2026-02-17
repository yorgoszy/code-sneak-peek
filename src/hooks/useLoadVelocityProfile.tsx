import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  buildVelocityProfile, 
  predictVelocityFromPercentage,
  type VelocityProfile, 
  type LoadVelocityPoint 
} from '@/utils/velocityPrediction';

interface UseLoadVelocityProfileProps {
  userId: string | null;
  exerciseId: string | null;
}

export const useLoadVelocityProfile = ({ userId, exerciseId }: UseLoadVelocityProfileProps) => {
  const [profile, setProfile] = useState<VelocityProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile(null);

    if (!userId || !exerciseId) {
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Get terminal velocity for the exercise
        const { data: exerciseData } = await supabase
          .from('exercises')
          .select('terminal_velocity')
          .eq('id', exerciseId)
          .single();

        const terminalVelocity = exerciseData?.terminal_velocity;
        if (!terminalVelocity) {
          setLoading(false);
          return;
        }

        // Get all load/velocity data points for this user+exercise
        const { data: attempts, error } = await supabase
          .from('strength_test_attempts')
          .select(`
            weight_kg,
            velocity_ms,
            strength_test_sessions!inner (user_id)
          `)
          .eq('exercise_id', exerciseId)
          .eq('strength_test_sessions.user_id', userId)
          .not('velocity_ms', 'is', null)
          .gt('velocity_ms', 0);

        if (error || !attempts?.length) {
          setLoading(false);
          return;
        }

        const points: LoadVelocityPoint[] = attempts.map(a => ({
          weight_kg: a.weight_kg,
          velocity_ms: a.velocity_ms!
        }));

        const result = buildVelocityProfile(points, terminalVelocity);
        setProfile(result);
      } catch (err) {
        console.error('Error building velocity profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, exerciseId]);

  const getVelocityForPercentage = (percentage: number, oneRM: number): number | null => {
    if (!profile) return null;
    return predictVelocityFromPercentage(profile, percentage, oneRM);
  };

  return { profile, loading, getVelocityForPercentage };
};
