
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseRepsToTime, parseTempoToSeconds, parseRestTime, parseNumberWithComma } from '@/utils/timeCalculations';
import { format } from "date-fns";

interface WeekStats {
  scheduledHours: number;
  actualHours: number;
  scheduledWorkouts: number;
  totalScheduledWorkouts: number;
  missedWorkouts: number;
  scheduledMinutes: number;
  actualMinutes: number;
}

export const useWeekStats = (userId: string) => {
  const [stats, setStats] = useState<WeekStats>({
    scheduledHours: 0,
    actualHours: 0,
    scheduledWorkouts: 0,
    totalScheduledWorkouts: 0,
    missedWorkouts: 0,
    scheduledMinutes: 0,
    actualMinutes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWeekStats();
    }
  }, [userId]);

  const fetchWeekStats = async () => {
    try {
      setLoading(true);
      
      // Υπολογισμός ημερομηνιών τρέχουσας εβδομάδας (ξεκινάει από Δευτέρα)
      const now = new Date();
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Για Κυριακή πάμε στην προηγούμενη Δευτέρα
      startOfWeek.setDate(now.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Κυριακή
      endOfWeek.setHours(23, 59, 59, 999);

      console.log('🔍 Week Stats: Calculating for week', startOfWeek.toDateString(), 'to', endOfWeek.toDateString());

      // Φέτε τα προγράμματα του χρήστη - χρησιμοποιούμε την ίδια λογική με το UserProfileDailyProgram
      const { data: userPrograms, error: programsError } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs:program_id (
            id,
            name,
            description,
            program_weeks (
              id,
              week_number,
              name,
              program_days (
                id,
                day_number,
                name,
                estimated_duration_minutes,
                program_blocks (
                  id,
                  name,
                  sets,
                  program_exercises (
                    id,
                    exercise_id,
                    sets,
                    reps,
                    kg,
                    tempo,
                    rest,
                    notes,
                    exercises (
                      id,
                      name,
                      description,
                      video_url
                    )
                  )
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (programsError) {
        throw programsError;
      }

      // Φέτε workout completions
      const { data: completions, error: completionsError } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId);

      if (completionsError) {
        throw completionsError;
      }

      console.log('📅 Found user programs:', userPrograms?.length || 0);
      console.log('📊 Found completions:', completions?.length || 0);

      // Helper function για να βρούμε το day program - ίδια λογική με UserProfileDailyProgram
      const getDayProgram = (date: Date, programs: any[]) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        for (const program of programs) {
          if (!program.training_dates) continue;
          
          const dateIndex = program.training_dates.findIndex(d => d === dateStr);
          if (dateIndex === -1) continue;

          const weeks = program.programs?.program_weeks || [];
          if (weeks.length === 0) continue;

          // Βρίσκουμε τη συνολική ημέρα στο πρόγραμμα
          let targetDay = null;
          let currentDayCount = 0;

          for (const week of weeks) {
            const daysInWeek = week.program_days?.length || 0;
            
            if (dateIndex >= currentDayCount && dateIndex < currentDayCount + daysInWeek) {
              const dayIndexInWeek = dateIndex - currentDayCount;
              targetDay = week.program_days?.[dayIndexInWeek] || null;
              break;
            }
            
            currentDayCount += daysInWeek;
          }

          if (targetDay) {
            return {
              program,
              targetDay,
              dateIndex
            };
          }
        }
        return null;
      };

      // Helper functions από DayCalculations
      const parseRepsToTime = (reps: any) => {
        if (!reps) return 0;
        const repsStr = String(reps);
        if (repsStr.includes('.')) {
          return repsStr.split('.').reduce((sum: number, val: string) => sum + (parseInt(val) || 0), 0);
        }
        return parseInt(repsStr) || 0;
      };

      const parseTempoToSeconds = (tempo: any) => {
        if (!tempo || tempo === '0') return 4;
        const tempoStr = String(tempo);
        if (tempoStr.includes('.')) {
          return tempoStr.split('.').reduce((sum: number, val: string) => sum + (parseInt(val) || 0), 0);
        }
        return parseInt(tempoStr) || 4;
      };

      // Υπολογισμός εβδομαδιαίων στατιστικών
      let allWeeklyWorkouts = 0;
      let completedCount = 0;
      let missedCount = 0;
      let totalScheduledMinutes = 0;
      let totalActualMinutes = 0;

      // Γενάρουμε όλες τις ημέρες της εβδομάδας
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        weekDays.push(day);
      }

      console.log('📅 Checking days:', weekDays.map(d => format(d, 'yyyy-MM-dd')));

      // Ελέγχουμε κάθε ημέρα της εβδομάδας
      for (const day of weekDays) {
        const dayProgram = getDayProgram(day, userPrograms || []);
        
        if (!dayProgram) continue; // Δεν υπάρχει πρόγραμμα για αυτή την ημέρα
        
        allWeeklyWorkouts++;
        const dateStr = format(day, 'yyyy-MM-dd');
        
        console.log('🏋️ Found workout for', dateStr, '- Program:', dayProgram.program.programs?.name);

        // Έλεγχος completion
        const completion = completions?.find(c => 
          c.assignment_id === dayProgram.program.id && c.scheduled_date === dateStr
        );

        if (completion) {
          if (completion.status === 'completed') {
            completedCount++;
            if (completion.actual_duration_minutes) {
              totalActualMinutes += completion.actual_duration_minutes;
            }
          } else if (completion.status === 'missed') {
            missedCount++;
          }
        } else {
          // Έλεγχος αν έχει περάσει η ημερομηνία
          const today = new Date();
          const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          if (isPast) {
            missedCount++;
          }
        }

        // Υπολογισμός χρόνου από το program day - ίδια λογική με DayCalculations
        if (dayProgram.targetDay?.program_blocks) {
          let totalTimeSeconds = 0;

          dayProgram.targetDay.program_blocks.forEach((block: any) => {
            block.program_exercises?.forEach((exercise: any) => {
              if (exercise.exercise_id) {
                const sets = exercise.sets || 0;
                const repsData = parseRepsToTime(exercise.reps);
                const tempo = parseTempoToSeconds(exercise.tempo);
                const restTime = parseInt(exercise.rest) || 0;
                
                const exerciseTime = (sets * repsData * tempo) + ((sets - 1) * restTime);
                totalTimeSeconds += exerciseTime;
              }
            });
          });

          const timeMinutes = Math.round(totalTimeSeconds / 60);
          totalScheduledMinutes += timeMinutes;
          
          console.log('⏰ Day', dateStr, 'calculated time:', timeMinutes, 'minutes');
        }
      }

      console.log('📊 Week Stats Final:', {
        allWeeklyWorkouts,
        completedCount,
        missedCount,
        totalScheduledMinutes,
        totalActualMinutes
      });

      const weeklyStats = {
        scheduledHours: Math.floor(totalScheduledMinutes / 60),
        scheduledMinutes: totalScheduledMinutes % 60,
        actualHours: Math.floor(totalActualMinutes / 60),
        actualMinutes: totalActualMinutes % 60,
        scheduledWorkouts: allWeeklyWorkouts,
        totalScheduledWorkouts: allWeeklyWorkouts,
        missedWorkouts: missedCount
      };

      setStats(weeklyStats);
    } catch (error) {
      console.error('Error fetching week stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};
