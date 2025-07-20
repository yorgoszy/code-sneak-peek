
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

      // Fetch workout completions for both months (για ολοκληρωμένες προπονήσεις)
      const [currentMonthData, previousMonthData] = await Promise.all([
        fetchWorkoutCompletions(userId, dateRanges.currentMonth.start, dateRanges.currentMonth.end),
        fetchWorkoutCompletions(userId, dateRanges.previousMonth.start, dateRanges.previousMonth.end)
      ]);

      // Calculate completed workouts metrics
      const [currentMonthCompleted, previousMonthCompleted] = await Promise.all([
        calculateWorkoutMetrics(currentMonthData),
        calculateWorkoutMetrics(previousMonthData)
      ]);

      // Calculate missed workouts using the correct method
      const [currentMonthMissed, previousMonthMissed] = await Promise.all([
        calculateScheduledWorkoutMetrics(userId, dateRanges.currentMonth.start, dateRanges.currentMonth.end),
        calculateScheduledWorkoutMetrics(userId, dateRanges.previousMonth.start, dateRanges.previousMonth.end)
      ]);

      // Calculate improvements based on completed workouts
      const workoutsImprovement = currentMonthCompleted.completedWorkouts - previousMonthCompleted.completedWorkouts;
      const hoursImprovement = currentMonthCompleted.totalTrainingHours - previousMonthCompleted.totalTrainingHours;
      const volumeImprovement = currentMonthCompleted.totalVolume - previousMonthCompleted.totalVolume;

      setStats({
        currentMonth: {
          completedWorkouts: currentMonthCompleted.completedWorkouts, // Ολοκληρωμένες (πράσινες)
          totalTrainingHours: currentMonthCompleted.totalTrainingHours,
          totalVolume: currentMonthCompleted.totalVolume,
          missedWorkouts: currentMonthMissed.missedWorkouts // Χαμένες (κόκκινες)
        },
        previousMonth: {
          completedWorkouts: previousMonthCompleted.completedWorkouts, // Ολοκληρωμένες (πράσινες)
          totalTrainingHours: previousMonthCompleted.totalTrainingHours,
          totalVolume: previousMonthCompleted.totalVolume,
          missedWorkouts: previousMonthMissed.missedWorkouts // Χαμένες (κόκκινες)
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
