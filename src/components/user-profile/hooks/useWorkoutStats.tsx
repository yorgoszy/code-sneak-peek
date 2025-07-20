
import { useState, useEffect } from "react";
import { fetchWorkoutCompletions, calculateWorkoutMetrics, calculateScheduledWorkoutMetrics, getDateRanges } from "./workoutStatsService";
import { WorkoutStats } from "./workoutStatsTypes";

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
      
      const dateRanges = getDateRanges();

      // Fetch workout completions for both months  
      const [currentMonthData, previousMonthData] = await Promise.all([
        fetchWorkoutCompletions(userId, dateRanges.currentMonth.start, dateRanges.currentMonth.end),
        fetchWorkoutCompletions(userId, dateRanges.previousMonth.start, dateRanges.previousMonth.end)
      ]);

      // Calculate metrics for both months (completed workouts)
      const [currentMonthMetrics, previousMonthMetrics] = await Promise.all([
        calculateWorkoutMetrics(currentMonthData),
        calculateWorkoutMetrics(previousMonthData)
      ]);

      // Calculate missing workouts separately using the correct method
      const [currentMonthMissed, previousMonthMissed] = await Promise.all([
        calculateScheduledWorkoutMetrics(userId, dateRanges.currentMonth.start, dateRanges.currentMonth.end),
        calculateScheduledWorkoutMetrics(userId, dateRanges.previousMonth.start, dateRanges.previousMonth.end)
      ]);

      // Calculate improvements based on completed workouts
      const workoutsImprovement = currentMonthMetrics.completedWorkouts - previousMonthMetrics.completedWorkouts;
      const hoursImprovement = currentMonthMetrics.totalTrainingHours - previousMonthMetrics.totalTrainingHours;
      const volumeImprovement = currentMonthMetrics.totalVolume - previousMonthMetrics.totalVolume;

      setStats({
        currentMonth: {
          completedWorkouts: currentMonthMetrics.completedWorkouts,
          totalTrainingHours: currentMonthMetrics.totalTrainingHours,
          totalVolume: currentMonthMetrics.totalVolume,
          missedWorkouts: currentMonthMissed.missedWorkouts
        },
        previousMonth: {
          completedWorkouts: previousMonthMetrics.completedWorkouts,
          totalTrainingHours: previousMonthMetrics.totalTrainingHours,
          totalVolume: previousMonthMetrics.totalVolume,
          missedWorkouts: previousMonthMissed.missedWorkouts
        },
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
