
import { useState, useEffect } from "react";
import { fetchWorkoutCompletions, calculateWorkoutMetrics, calculateScheduledWorkoutMetrics, getDateRanges } from "./workoutStatsService";
import { WorkoutStats } from "./workoutStatsTypes";

export const useWorkoutStats = (userId: string) => {
  const [stats, setStats] = useState<WorkoutStats>({
    currentMonth: {
      scheduledWorkouts: 0,
      totalTrainingHours: 0,
      totalVolume: 0,
      missedWorkouts: 0
    },
    previousMonth: {
      scheduledWorkouts: 0,
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
      
      const dateRanges = getDateRanges();

      // Calculate metrics for both months using scheduled workouts
      const [currentMonthMetrics, previousMonthMetrics] = await Promise.all([
        calculateScheduledWorkoutMetrics(userId, dateRanges.currentMonth.start, dateRanges.currentMonth.end),
        calculateScheduledWorkoutMetrics(userId, dateRanges.previousMonth.start, dateRanges.previousMonth.end)
      ]);

      // Calculate improvements
      const workoutsImprovement = currentMonthMetrics.scheduledWorkouts - previousMonthMetrics.scheduledWorkouts;
      const hoursImprovement = currentMonthMetrics.totalTrainingHours - previousMonthMetrics.totalTrainingHours;
      const volumeImprovement = currentMonthMetrics.totalVolume - previousMonthMetrics.totalVolume;

      setStats({
        currentMonth: currentMonthMetrics,
        previousMonth: previousMonthMetrics,
        improvements: {
          workoutsImprovement,
          hoursImprovement: Math.round(hoursImprovement * 10) / 10,
          volumeImprovement: Math.round(volumeImprovement)
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
