
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

      // Mirror την ίδια λογική από το UserProfileDailyProgram calculateMonthlyStats
      const [currentMonthStats, previousMonthStats] = await Promise.all([
        calculateMonthlyStatsLikeCalendar(userId, dateRanges.currentMonth.start, dateRanges.currentMonth.end),
        calculateMonthlyStatsLikeCalendar(userId, dateRanges.previousMonth.start, dateRanges.previousMonth.end)
      ]);

      // Calculate improvements based on completed workouts
      const workoutsImprovement = currentMonthStats.completedWorkouts - previousMonthStats.completedWorkouts;
      const hoursImprovement = currentMonthStats.totalTrainingHours - previousMonthStats.totalTrainingHours;
      const volumeImprovement = currentMonthStats.totalVolume - previousMonthStats.totalVolume;

      setStats({
        currentMonth: {
          completedWorkouts: currentMonthStats.completedWorkouts, // Ολοκληρωμένες (πράσινες) όπως στο ημερολόγιο
          totalTrainingHours: currentMonthStats.totalTrainingHours,
          totalVolume: currentMonthStats.totalVolume,
          missedWorkouts: currentMonthStats.missedWorkouts // Χαμένες (κόκκινες) όπως στο ημερολόγιο
        },
        previousMonth: {
          completedWorkouts: previousMonthStats.completedWorkouts, // Ολοκληρωμένες (πράσινες) όπως στο ημερολόγιο
          totalTrainingHours: previousMonthStats.totalTrainingHours,
          totalVolume: previousMonthStats.totalVolume,
          missedWorkouts: previousMonthStats.missedWorkouts // Χαμένες (κόκκινες) όπως στο ημερολόγιο
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

  // Mirror την ίδια λογική από το UserProfileDailyProgram calculateMonthlyStats
  const calculateMonthlyStatsLikeCalendar = async (userId: string, startDate: string, endDate: string) => {
    const { supabase } = await import("@/integrations/supabase/client");
    
    // Βρες τα προγράμματα του χρήστη - απλό query χωρίς nested relations
    const { data: assignments } = await supabase
      .from('program_assignments')
      .select('id, training_dates')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!assignments?.length) {
      return { completedWorkouts: 0, totalTrainingHours: 0, totalVolume: 0, missedWorkouts: 0 };
    }

    // Βρες τα workout completions
    const assignmentIds = assignments.map(a => a.id);
    const { data: completions } = await supabase
      .from('workout_completions')
      .select('*')
      .in('assignment_id', assignmentIds)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate);

    let completedWorkouts = 0;
    let missedWorkouts = 0;
    let totalTrainingHours = 0;

    for (const assignment of assignments) {
      if (!assignment.training_dates) continue;
      
      const monthlyDates = assignment.training_dates.filter(date => 
        date && date >= startDate && date <= endDate
      );
      
      for (const date of monthlyDates) {
        const completion = completions?.find(c => 
          c.assignment_id === assignment.id && c.scheduled_date === date
        );
        
        if (completion?.status === 'completed') {
          completedWorkouts++;
          
          // Υπολογισμός ωρών από completed workout
          if (completion.actual_duration_minutes) {
            totalTrainingHours += completion.actual_duration_minutes / 60;
          }
        } else {
          // Έλεγχος αν έχει περάσει η ημερομηνία
          const workoutDate = new Date(date);
          const today = new Date();
          const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          if (isPast || completion?.status === 'missed') {
            missedWorkouts++;
          }
        }
      }
    }

    // Υπολογισμός όγκου από τα completed workouts
    const volumeStats = await calculateWorkoutMetrics(completions || []);

    return {
      completedWorkouts,
      totalTrainingHours: Math.round(totalTrainingHours * 10) / 10,
      totalVolume: volumeStats.totalVolume,
      missedWorkouts
    };
  };

  return { stats, loading };
};
