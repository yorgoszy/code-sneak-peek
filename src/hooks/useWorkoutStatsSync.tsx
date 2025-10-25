import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

interface WorkoutStats {
  completed: number;
  total: number;
  missed: number;
}

interface WorkoutStatsData {
  today: {
    hasWorkout: boolean;
    program?: string;
    exercises?: Array<{ name: string; sets: string; reps: string }>;
    completed: boolean;
  };
  thisWeek: {
    scheduled: number;
    completed: number;
    remaining: number;
    upcomingDays: string[];
  };
  activePrograms: Array<{
    name: string;
    assignmentId: string;
    stats: WorkoutStats;
    nextWorkout?: string;
  }>;
  recentWorkouts: Array<{
    date: string;
    program: string;
    status: 'completed' | 'missed';
  }>;
}

export const useWorkoutStatsSync = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    const syncWorkoutStats = async () => {
      try {
        console.log('🔄 Syncing workout stats for user:', userId);

        // Fetch active programs with completions
        const { data: assignments } = await supabase
          .from('program_assignments')
          .select(`
            id,
            training_dates,
            program_id
          `)
          .eq('user_id', userId)
          .eq('status', 'active');

        if (!assignments || assignments.length === 0) return;

        // Fetch program details separately
        const programIds = assignments.map(a => a.program_id).filter(Boolean);
        const { data: programs } = await supabase
          .from('programs')
          .select(`
            id,
            name,
            program_weeks (
              program_days (
                name,
                program_blocks (
                  program_exercises (
                    sets,
                    reps,
                    exercises:exercise_id (
                      name
                    )
                  )
                )
              )
            )
          `)
          .in('id', programIds);

        // Fetch all completions for this user
        const { data: completions } = await supabase
          .from('workout_completions')
          .select('*')
          .eq('user_id', userId)
          .order('scheduled_date', { ascending: false });

        const today = format(new Date(), 'yyyy-MM-dd');
        const startOfWeek = format(new Date(), 'yyyy-MM-dd');
        const endOfWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

        // Build workout stats data
        const workoutStatsData: WorkoutStatsData = {
          today: {
            hasWorkout: false,
            completed: false
          },
          thisWeek: {
            scheduled: 0,
            completed: 0,
            remaining: 0,
            upcomingDays: []
          },
          activePrograms: [],
          recentWorkouts: []
        };

        // Process each assignment
        for (const assignment of assignments) {
          if (!assignment.training_dates || !assignment.program_id) continue;

          const trainingDates = assignment.training_dates as string[];
          const program = programs?.find(p => p.id === assignment.program_id);
          if (!program) continue;

          // Calculate stats for this program
          const stats: WorkoutStats = {
            completed: 0,
            total: trainingDates.length,
            missed: 0
          };

          let nextWorkout: string | undefined;

          for (const date of trainingDates) {
            const completion = completions?.find(
              c => c.assignment_id === assignment.id && c.scheduled_date === date
            );

            if (completion?.status === 'completed') {
              stats.completed++;
            } else if (completion?.status === 'missed') {
              stats.missed++;
            }

            // Find next workout
            if (!nextWorkout && date >= today) {
              nextWorkout = date;
            }

            // Check if today
            if (date === today) {
              const dayIndex = trainingDates.indexOf(date);
              const dayData = program.program_weeks?.[0]?.program_days?.[dayIndex];
              
              workoutStatsData.today = {
                hasWorkout: true,
                program: program.name,
                exercises: dayData?.program_blocks?.flatMap((block: any) =>
                  block.program_exercises?.map((pe: any) => ({
                    name: pe.exercises?.name || '',
                    sets: pe.sets || '',
                    reps: pe.reps || ''
                  })) || []
                ) || [],
                completed: completion?.status === 'completed'
              };
            }

            // Count this week's workouts
            if (date >= startOfWeek && date <= endOfWeek) {
              workoutStatsData.thisWeek.scheduled++;
              if (completion?.status === 'completed') {
                workoutStatsData.thisWeek.completed++;
              }
              if (date > today) {
                workoutStatsData.thisWeek.upcomingDays.push(date);
              }
            }
          }

          workoutStatsData.thisWeek.remaining = 
            workoutStatsData.thisWeek.scheduled - workoutStatsData.thisWeek.completed;

          workoutStatsData.activePrograms.push({
            name: program.name,
            assignmentId: assignment.id,
            stats,
            nextWorkout
          });
        }

        // Recent workouts (last 7 days)
        workoutStatsData.recentWorkouts = (completions || [])
          .slice(0, 7)
          .map(c => {
            const assignment = assignments.find(a => a.id === c.assignment_id);
            const prog = assignment ? programs?.find(p => p.id === assignment.program_id) : null;
            return {
              date: c.scheduled_date,
              program: prog?.name || '',
              status: c.status as 'completed' | 'missed'
            };
          });

        // Update ai_user_profiles
        const { error: updateError } = await supabase
          .from('ai_user_profiles')
          .upsert(
            {
              user_id: userId,
              workout_stats: workoutStatsData as any,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'user_id'
            }
          );

        if (updateError) {
          console.error('Error updating workout stats:', updateError);
        } else {
          console.log('✅ Workout stats synced successfully');
        }
      } catch (error) {
        console.error('Error syncing workout stats:', error);
      }
    };

    // Sync immediately
    syncWorkoutStats();

    // Set up interval to sync every 5 minutes
    const interval = setInterval(syncWorkoutStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);
};
