import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

      console.log('📊 Fetching workout stats for user:', userId);

      // Φέρε τα προγράμματα του χρήστη με πλήρη δεδομένα
      const { data: userPrograms, error: programsError } = await supabase
        .from('program_assignments')
        .select(`
          id,
          training_dates,
          programs!inner (
            id,
            name,
            program_weeks (
              id,
              week_number,
              program_days (
                id,
                day_number,
                program_blocks (
                  id,
                  program_exercises (
                    id,
                    sets,
                    reps,
                    tempo,
                    rest
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      console.log('📊 User programs:', userPrograms);
      console.log('📊 Programs error:', programsError);

      if (!userPrograms?.length) {
        console.log('📊 No user programs found');
        setLoading(false);
        return;
      }

      // Φέρε τα workout completions
      const assignmentIds = userPrograms.map(p => p.id);
      const { data: workoutCompletions } = await supabase
        .from('workout_completions')
        .select('*')
        .in('assignment_id', assignmentIds);

      console.log('📊 Workout completions:', workoutCompletions);

      // Helper functions για υπολογισμό χρόνου
      const parseTempoToSeconds = (tempo: string): number => {
        if (!tempo || tempo.trim() === '') return 3;
        const parts = tempo.split('.');
        let totalSeconds = 0;
        parts.forEach(part => {
          if (part === 'x' || part === 'X') {
            totalSeconds += 0.5;
          } else {
            totalSeconds += parseFloat(part) || 0;
          }
        });
        return totalSeconds;
      };

      const parseRepsToTotal = (reps: string): number => {
        if (!reps) return 0;
        if (!reps.includes('.')) {
          return parseInt(reps) || 0;
        }
        const parts = reps.split('.');
        let totalReps = 0;
        parts.forEach(part => {
          totalReps += parseInt(part) || 0;
        });
        return totalReps;
      };

      const parseRestTime = (rest: string): number => {
        if (!rest) return 0;
        if (rest.includes(':')) {
          const [minutes, seconds] = rest.split(':');
          return (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
        } else if (rest.includes("'")) {
          return (parseFloat(rest.replace("'", "")) || 0) * 60;
        } else if (rest.includes('s')) {
          return parseFloat(rest.replace('s', '')) || 0;
        } else {
          const minutes = parseFloat(rest) || 0;
          return minutes * 60;
        }
      };

      // Υπολογισμός χρόνου προπόνησης
      const calculateWorkoutDuration = (program: any, dateIndex: number): number => {
        const programData = program.programs;
        if (!programData?.program_weeks) return 0;

        const daysPerWeek = programData.program_weeks[0]?.program_days?.length || 1;
        const weekIndex = Math.floor(dateIndex / daysPerWeek);
        const dayIndex = dateIndex % daysPerWeek;

        const week = programData.program_weeks[weekIndex];
        if (!week) return 0;

        const day = week.program_days?.[dayIndex];
        if (!day) return 0;

        let totalSeconds = 0;
        day.program_blocks?.forEach((block: any) => {
          block.program_exercises?.forEach((exercise: any) => {
            const sets = exercise.sets || 0;
            const reps = parseRepsToTotal(exercise.reps || '0');
            const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
            const restSeconds = parseRestTime(exercise.rest || '');
            const workTime = sets * reps * tempoSeconds;
            const totalRestTime = sets * restSeconds;
            totalSeconds += workTime + totalRestTime;
          });
        });

        return totalSeconds / 60; // Επιστρέφουμε λεπτά
      };

      // ΑΚΡΙΒΗ ΑΝΤΙΓΡΑΦΗ από UserProfileDailyProgram calculateMonthlyStats
      const calculateMonthlyStats = (monthDate: Date) => {
        const monthStr = format(monthDate, 'yyyy-MM');
        
        // Βρες όλες τις προπονήσεις του μήνα από τα training dates
        let allMonthlyWorkouts = 0;
        let completedCount = 0;
        let missedCount = 0;
        let totalCompletedMinutes = 0;
        
        for (const program of userPrograms) {
          if (!program.training_dates) continue;
          
          const monthlyDates = program.training_dates.filter(date => 
            date && date.startsWith(monthStr)
          );
          
          for (let i = 0; i < monthlyDates.length; i++) {
            const date = monthlyDates[i];
            const dateIndex = program.training_dates.indexOf(date);
            allMonthlyWorkouts++;
            
            const completion = workoutCompletions?.find(c => 
              c.assignment_id === program.id && c.scheduled_date === date
            );
            
            if (completion?.status === 'completed') {
              completedCount++;
              // Υπολογίζουμε τον χρόνο της ολοκληρωμένης προπόνησης
              const workoutMinutes = calculateWorkoutDuration(program, dateIndex);
              totalCompletedMinutes += workoutMinutes;
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
          totalMinutes: totalCompletedMinutes
        };
      };

      // Υπολογισμός για τρέχον και προηγούμενο μήνα
      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      
      const currentMonthStats = calculateMonthlyStats(currentMonth);
      const previousMonthStats = calculateMonthlyStats(previousMonth);

      // Calculate improvements
      const workoutsImprovement = currentMonthStats.completed - previousMonthStats.completed;
      const hoursImprovement = (currentMonthStats.totalMinutes / 60) - (previousMonthStats.totalMinutes / 60);

      setStats({
        currentMonth: {
          completedWorkouts: currentMonthStats.completed,
          totalTrainingHours: Math.round(currentMonthStats.totalMinutes / 60 * 10) / 10, // Ώρες με 1 δεκαδικό
          totalVolume: 0, // Placeholder
          missedWorkouts: currentMonthStats.missed,
          scheduledWorkouts: currentMonthStats.total // Προσθήκη: συνολικές προγραμματισμένες
        },
        previousMonth: {
          completedWorkouts: previousMonthStats.completed,
          totalTrainingHours: Math.round(previousMonthStats.totalMinutes / 60 * 10) / 10,
          totalVolume: 0, // Placeholder
          missedWorkouts: previousMonthStats.missed,
          scheduledWorkouts: previousMonthStats.total
        },
        improvements: {
          workoutsImprovement,
          hoursImprovement: Math.round(hoursImprovement * 10) / 10,
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
