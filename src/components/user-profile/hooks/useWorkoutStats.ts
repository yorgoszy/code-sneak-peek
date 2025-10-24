import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { calculateScheduledWorkoutMetrics, getDateRanges } from './workoutStatsService';

interface WorkoutStats {
  currentMonth: {
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
    improvements: {
      workoutsImprovement: 0,
      hoursImprovement: 0,
      volumeImprovement: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const ranges = getDateRanges();
        const currentMetrics = await calculateScheduledWorkoutMetrics(
          userId, 
          ranges.currentMonth.start, 
          ranges.currentMonth.end
        );

        const previousMetrics = await calculateScheduledWorkoutMetrics(
          userId,
          ranges.previousMonth.start,
          ranges.previousMonth.end
        );

        setStats({
          currentMonth: {
            completedWorkouts: currentMetrics.scheduledWorkouts - currentMetrics.missedWorkouts,
            totalTrainingHours: currentMetrics.totalTrainingHours,
            totalVolume: currentMetrics.totalVolume,
            missedWorkouts: currentMetrics.missedWorkouts
          },
          improvements: {
            workoutsImprovement: (currentMetrics.scheduledWorkouts - currentMetrics.missedWorkouts) - 
                                 (previousMetrics.scheduledWorkouts - previousMetrics.missedWorkouts),
            hoursImprovement: currentMetrics.totalTrainingHours - previousMetrics.totalTrainingHours,
            volumeImprovement: currentMetrics.totalVolume - previousMetrics.totalVolume
          }
        });
      } catch (error) {
        console.error('Error fetching workout stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};
