
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
      
      const { supabase } = await import("@/integrations/supabase/client");

      // Φέρε τα προγράμματα του χρήστη
      const { data: userPrograms } = await supabase
        .from('program_assignments')
        .select('id, training_dates')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!userPrograms?.length) {
        setLoading(false);
        return;
      }

      // Φέρε τα workout completions
      const assignmentIds = userPrograms.map(p => p.id);
      const { data: workoutCompletions } = await supabase
        .from('workout_completions')
        .select('*')
        .in('assignment_id', assignmentIds);

      // ΑΚΡΙΒΗ ΑΝΤΙΓΡΑΦΗ από UserProfileDailyProgram calculateMonthlyStats
      const calculateMonthlyStats = (monthDate: Date) => {
        const monthStr = format(monthDate, 'yyyy-MM');
        
        // Βρες όλες τις προπονήσεις του μήνα από τα training dates
        let allMonthlyWorkouts = 0;
        let completedCount = 0;
        let missedCount = 0;
        
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
          total: allMonthlyWorkouts 
        };
      };

      // Υπολογισμός για τρέχον και προηγούμενο μήνα
      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      
      const currentMonthStats = calculateMonthlyStats(currentMonth);
      const previousMonthStats = calculateMonthlyStats(previousMonth);

      // Calculate improvements
      const workoutsImprovement = currentMonthStats.completed - previousMonthStats.completed;

      setStats({
        currentMonth: {
          completedWorkouts: currentMonthStats.completed,
          totalTrainingHours: 0, // Placeholder
          totalVolume: 0, // Placeholder
          missedWorkouts: currentMonthStats.missed
        },
        previousMonth: {
          completedWorkouts: previousMonthStats.completed,
          totalTrainingHours: 0, // Placeholder
          totalVolume: 0, // Placeholder
          missedWorkouts: previousMonthStats.missed
        },
        improvements: {
          workoutsImprovement,
          hoursImprovement: 0, // Placeholder
          volumeImprovement: 0 // Placeholder
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
