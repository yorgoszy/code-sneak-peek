
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutStats {
  currentMonth: {
    completedWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
  };
  previousMonth: {
    completedWorkouts: number;
    totalTrainingHours: number;
    totalVolume: number;
    missedWorkouts: number;
  };
  improvements: {
    workoutsImprovement: number;
    hoursImprovement: number;
    volumeImprovement: number;
  };
}

export const useWorkoutStats = (userId: string) => {
  const [stats, setStats] = useState<WorkoutStats>({
    currentMonth: {
      completedWorkouts: 0,
      totalTrainingHours: 0,
      totalVolume: 0,
      missedWorkouts: 0
    },
    previousMonth: {
      completedWorkouts: 0,
      totalTrainingHours: 0,
      totalVolume: 0,
      missedWorkouts: 0
    },
    improvements: {
      workoutsImprovement: 0,
      hoursImprovement: 0,
      volumeImprovement: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWorkoutStats();
    }
  }, [userId]);

  const fetchWorkoutStats = async () => {
    try {
      setLoading(true);
      
      // Υπολογισμός ημερομηνιών για τρέχοντα και προηγούμενο μήνα
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch workout completions για τρέχοντα μήνα
      const { data: currentMonthData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_date', currentMonthStart.toISOString().split('T')[0])
        .lte('completed_date', currentMonthEnd.toISOString().split('T')[0]);

      // Fetch workout completions για προηγούμενο μήνα
      const { data: previousMonthData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_date', previousMonthStart.toISOString().split('T')[0])
        .lte('completed_date', previousMonthEnd.toISOString().split('T')[0]);

      // Υπολογισμός στατιστικών τρέχοντος μήνα
      const currentCompleted = currentMonthData?.filter(w => w.status === 'completed').length || 0;
      const currentMissed = currentMonthData?.filter(w => w.status === 'missed').length || 0;
      
      // Εκτίμηση ωρών προπονήσεων (θεωρούμε μέσο όρο 1.5 ώρα ανά προπόνηση)
      const currentHours = currentCompleted * 1.5;
      
      // Εκτίμηση όγκου προπονήσεων (θεωρούμε μέσο όρο 500 kg ανά προπόνηση)
      const currentVolume = currentCompleted * 500;

      // Υπολογισμός στατιστικών προηγούμενου μήνα
      const previousCompleted = previousMonthData?.filter(w => w.status === 'completed').length || 0;
      const previousMissed = previousMonthData?.filter(w => w.status === 'missed').length || 0;
      const previousHours = previousCompleted * 1.5;
      const previousVolume = previousCompleted * 500;

      // Υπολογισμός βελτιώσεων
      const workoutsImprovement = currentCompleted - previousCompleted;
      const hoursImprovement = currentHours - previousHours;
      const volumeImprovement = currentVolume - previousVolume;

      setStats({
        currentMonth: {
          completedWorkouts: currentCompleted,
          totalTrainingHours: currentHours,
          totalVolume: currentVolume,
          missedWorkouts: currentMissed
        },
        previousMonth: {
          completedWorkouts: previousCompleted,
          totalTrainingHours: previousHours,
          totalVolume: previousVolume,
          missedWorkouts: previousMissed
        },
        improvements: {
          workoutsImprovement,
          hoursImprovement,
          volumeImprovement
        }
      });

    } catch (error) {
      console.error('Error fetching workout stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};
