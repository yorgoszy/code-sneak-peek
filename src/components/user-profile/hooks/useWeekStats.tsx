
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseRepsToTime, parseTempoToSeconds, parseRestTime, parseNumberWithComma } from '@/utils/timeCalculations';

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

      // Φέρε τα προγράμματα του χρήστη
      const { data: userPrograms } = await supabase
        .from('program_assignments')
        .select('id, program_id, training_dates')
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

      // ΑΚΡΙΒΗ ΑΝΤΙΓΡΑΦΗ από UserProfileDailyProgram calculateWeeklyStats
      const calculateWeeklyStats = async () => {
        const weekStr = startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD
        console.log('🔍 Week Stats: Starting calculation for week:', weekStr);
        
        // Βρες όλες τις προπονήσεις της εβδομάδας από τα training dates
        let allWeeklyWorkouts = 0;
        let completedCount = 0;
        let missedCount = 0;
        let totalScheduledMinutes = 0;
        let totalActualMinutes = 0;
        
        for (const program of userPrograms) {
          if (!program.training_dates) continue;
          console.log('📅 Processing program:', program.id, 'training_dates:', program.training_dates);
          
          const weeklyDates = program.training_dates.filter(date => {
            if (!date) return false;
            const trainingDate = new Date(date);
            return trainingDate >= startOfWeek && trainingDate <= endOfWeek;
          });
          
          console.log('📅 Weekly dates for program:', program.id, weeklyDates);
          
          // Φέρε τα στοιχεία του προγράμματος για υπολογισμό χρόνου
          const { data: programData } = await supabase
            .from('programs')
            .select(`
              id,
              program_weeks(
                program_days(
                  day_number,
                  program_blocks(
                    program_exercises(
                      sets,
                      reps,
                      kg,
                      tempo,
                      rest,
                      percentage_1rm,
                      velocity_ms,
                      exercise_id
                    )
                  )
                )
              )
            `)
            .eq('id', program.program_id)
            .single();
          
          for (const date of weeklyDates) {
            allWeeklyWorkouts++;
            
            const completion = workoutCompletions?.find(c => 
              c.assignment_id === program.id && c.scheduled_date === date
            );
            
            if (completion?.status === 'completed') {
              completedCount++;
              
              // Υπολογισμός πραγματικών ωρών
              if (completion.actual_duration_minutes) {
                totalActualMinutes += completion.actual_duration_minutes;
              } else if (completion.start_time && completion.end_time) {
                const start = new Date(completion.start_time);
                const end = new Date(completion.end_time);
                const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                totalActualMinutes += durationMinutes;
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
            
            // Υπολογισμός προγραμματισμένων λεπτών - χρησιμοποιούμε την ίδια ακριβώς λογική με το DayCalculations
            if (programData?.program_weeks?.[0]?.program_days) {
              const dateIndex = program.training_dates.indexOf(date);
              const daysPerWeek = programData.program_weeks[0].program_days.length;
              const dayInCycle = dateIndex % daysPerWeek;
              const programDay = programData.program_weeks[0].program_days[dayInCycle];
              
              if (programDay?.program_blocks) {
                // ΑΚΡΙΒΗ ΑΝΤΙΓΡΑΦΗ της calculateDayMetrics από DayCalculations
                let totalVolume = 0;
                let totalIntensitySum = 0;
                let intensityCount = 0;
                let totalWatts = 0;
                let totalTimeSeconds = 0;

                programDay.program_blocks.forEach((block: any) => {
                  block.program_exercises?.forEach((exercise: any) => {
                    if (exercise.exercise_id) {
                      const sets = exercise.sets || 0;
                      const repsData = parseRepsToTime(exercise.reps);
                      const kg = parseNumberWithComma(exercise.kg || '0');

                      if (repsData.isTime) {
                        // Αν το reps είναι χρόνος, προσθέτουμε τον χρόνο απευθείας
                        // Time calculation for time-based reps: sets × time_per_set + (sets - 1) × rest
                        const workTime = sets * repsData.seconds;
                        const restSeconds = parseRestTime(exercise.rest || '');
                        const totalRestTime = (sets - 1) * restSeconds;
                        totalTimeSeconds += workTime + totalRestTime;
                        
                        // Δεν υπολογίζουμε όγκο για χρονικές ασκήσεις
                      } else {
                        // Κανονική άσκηση με επαναλήψεις
                        const reps = repsData.count;
                        
                        // Volume calculation (sets × reps × kg) in kg
                        const volumeKg = sets * reps * kg;
                        totalVolume += volumeKg;

                        // Time calculation: (sets × reps × tempo) + (sets - 1) × rest
                        const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
                        const restSeconds = parseRestTime(exercise.rest || '');
                        
                        // Work time: sets × reps × tempo (in seconds)
                        const workTime = sets * reps * tempoSeconds;
                        
                        // Rest time: (sets - 1) × rest time between sets
                        const totalRestTime = (sets - 1) * restSeconds;
                        
                        totalTimeSeconds += workTime + totalRestTime;
                      }

                      // Intensity calculation - μέσος όρος όλων των εντάσεων
                      const intensity = parseNumberWithComma(exercise.percentage_1rm || '0');
                      if (intensity > 0) {
                        totalIntensitySum += intensity;
                        intensityCount++;
                      }

                      // Watts calculation - Force × Velocity (μόνο για ασκήσεις με βάρος)
                      const velocity = parseNumberWithComma(exercise.velocity_ms || '0');
                      if (kg > 0 && velocity > 0 && !repsData.isTime) {
                        // Force = mass × acceleration (9.81 m/s²)
                        const force = kg * 9.81; // in Newtons
                        // Power = Force × Velocity
                        const watts = force * velocity;
                        // Συνολική ισχύς για όλα τα sets και reps
                        totalWatts += watts * sets * repsData.count;
                      }
                    }
                  });
                });

                // Επιστρέφουμε το time σε λεπτά - ίδια ακριβώς λογική με DayCalculations
                const dayTimeMinutes = Math.round(totalTimeSeconds / 60);
                totalScheduledMinutes += dayTimeMinutes;
                console.log('⏰ Day time for date:', date, 'minutes:', dayTimeMinutes, 'totalTimeSeconds:', totalTimeSeconds);
              }
            }
          }
        }

        console.log('📊 Final week stats:', { 
          completed: completedCount, 
          missed: missedCount, 
          total: allWeeklyWorkouts,
          scheduledMinutes: totalScheduledMinutes,
          actualMinutes: totalActualMinutes
        });

        return { 
          completed: completedCount, 
          missed: missedCount, 
          total: allWeeklyWorkouts,
          scheduledMinutes: totalScheduledMinutes,
          actualMinutes: totalActualMinutes
        };
      };

      const weeklyStats = await calculateWeeklyStats();

      setStats({
        scheduledHours: Math.round((weeklyStats.scheduledMinutes / 60) * 10) / 10,
        actualHours: Math.round((weeklyStats.actualMinutes / 60) * 10) / 10,
        scheduledWorkouts: weeklyStats.total,
        totalScheduledWorkouts: weeklyStats.total,
        missedWorkouts: weeklyStats.missed,
        scheduledMinutes: weeklyStats.scheduledMinutes,
        actualMinutes: weeklyStats.actualMinutes
      });

    } catch (error) {
      console.error('Error fetching week stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};
