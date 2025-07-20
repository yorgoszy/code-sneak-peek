
import { useState, useEffect } from "react";
import { WorkoutStats } from "./workoutStatsTypes";
import { format } from "date-fns";

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
      
      // Ακριβής mirroring από UserProfileDailyProgram calculateMonthlyStats
      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      
      const currentMonthStats = await calculateMonthlyStatsLikeCalendar(userId, currentMonth);
      const previousMonthStats = await calculateMonthlyStatsLikeCalendar(userId, previousMonth);

      // Calculate improvements
      const workoutsImprovement = currentMonthStats.completed - previousMonthStats.completed;
      const hoursImprovement = currentMonthStats.totalHours - previousMonthStats.totalHours;
      const volumeImprovement = currentMonthStats.totalVolume - previousMonthStats.totalVolume;

      setStats({
        currentMonth: {
          completedWorkouts: currentMonthStats.completed,
          totalTrainingHours: currentMonthStats.totalHours,
          totalVolume: currentMonthStats.totalVolume,
          missedWorkouts: currentMonthStats.missed
        },
        previousMonth: {
          completedWorkouts: previousMonthStats.completed,
          totalTrainingHours: previousMonthStats.totalHours,
          totalVolume: previousMonthStats.totalVolume,
          missedWorkouts: previousMonthStats.missed
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

  // Ακριβής copy από UserProfileDailyProgram calculateMonthlyStats
  const calculateMonthlyStatsLikeCalendar = async (userId: string, month: Date) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const monthStr = format(month, 'yyyy-MM');
    
    // Βρες όλα τα προγράμματα του χρήστη
    const { data: userPrograms } = await supabase
      .from('program_assignments')
      .select(`
        id,
        training_dates,
        programs!inner(
          program_weeks(
            program_days(
              estimated_duration_minutes
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!userPrograms?.length) {
      return { completed: 0, missed: 0, total: 0, totalHours: 0, totalVolume: 0 };
    }

    // Βρες όλα τα workout completions
    const assignmentIds = userPrograms.map(p => p.id);
    const { data: workoutCompletions } = await supabase
      .from('workout_completions')
      .select('*')
      .in('assignment_id', assignmentIds);
    
    // Βρες όλες τις προπονήσεις του μήνα από τα training dates
    let allMonthlyWorkouts = 0;
    let completedCount = 0;
    let missedCount = 0;
    let totalHours = 0;
    let totalVolume = 0;
    
    for (const program of userPrograms) {
      if (!program.training_dates) continue;
      
      const monthlyDates = program.training_dates.filter(date => 
        date && date.startsWith(monthStr)
      );
      
      for (const date of monthlyDates) {
        allMonthlyWorkouts++;
        
        const completion = workoutCompletions?.find(c => 
          c.assignment_id === program.id && c.scheduled_date === date
        );
        
        if (completion?.status === 'completed') {
          completedCount++;
          if (completion.actual_duration_minutes) {
            totalHours += completion.actual_duration_minutes / 60;
          }
        } else {
          // Έλεγχος αν έχει περάσει η ημερομηνία
          const workoutDate = new Date(date);
          const today = new Date();
          const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          if (isPast || completion?.status === 'missed') {
            missedCount++;
          }
        }
      }
    }

    return { 
      completed: completedCount, 
      missed: missedCount, 
      total: allMonthlyWorkouts,
      totalHours: Math.round(totalHours * 10) / 10,
      totalVolume: 0 // Placeholder για τώρα
    };
  };

  return { stats, loading };
};
