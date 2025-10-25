import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

interface WorkoutStats {
  completed: number;
  total: number;
  missed: number;
}

interface ProgressData {
  strength: Record<string, {
    latest1RM: number;
    latestVelocity: number;
    latestDate: string;
    percentageChange: number | null;
    history: Array<{ weight: number; velocity: number; date: string }>;
  }>;
  anthropometric: {
    weight?: number;
    height?: number;
    bodyFat?: number;
    muscleMass?: number;
    lastMeasurement?: string;
  };
  endurance: {
    vo2Max?: number;
    pushUps?: number;
    pullUps?: number;
    lastMeasurement?: string;
  };
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
  progress: ProgressData;
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
          recentWorkouts: [],
          progress: {
            strength: {},
            anthropometric: {},
            endurance: {}
          }
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

        // Fetch Progress Data - Strength tests
        const { data: strengthTests } = await supabase
          .from('strength_test_attempts')
          .select(`
            weight_kg,
            velocity_ms,
            exercise_id,
            test_session_id,
            exercises:exercise_id (
              name
            ),
            strength_test_sessions!inner (
              user_id,
              test_date
            )
          `)
          .eq('strength_test_sessions.user_id', userId)
          .not('velocity_ms', 'is', null)
          .order('strength_test_sessions.test_date', { ascending: false })
          .limit(50);

        // Process strength data
        if (strengthTests && strengthTests.length > 0) {
          const exerciseMap: Record<string, any[]> = {};
          
          strengthTests.forEach((test: any) => {
            const exerciseName = test.exercises?.name || 'Unknown';
            if (!exerciseMap[exerciseName]) {
              exerciseMap[exerciseName] = [];
            }
            exerciseMap[exerciseName].push(test);
          });

          // Calculate 1RM for each exercise
          Object.keys(exerciseMap).forEach(exerciseName => {
            const tests = exerciseMap[exerciseName];
            
            // Group by session
            const sessions = tests.reduce((acc: any, test: any) => {
              const sessionId = test.test_session_id;
              if (!acc[sessionId]) {
                acc[sessionId] = {
                  date: test.strength_test_sessions.test_date,
                  attempts: []
                };
              }
              acc[sessionId].attempts.push(test);
              return acc;
            }, {});

            const sessionArray = Object.values(sessions).sort((a: any, b: any) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            if (sessionArray.length > 0) {
              const latestSession: any = sessionArray[0];
              const latest1RM = latestSession.attempts.reduce((max: any, curr: any) => 
                curr.weight_kg > max.weight_kg ? curr : max
              );

              let percentageChange = null;
              const history: any[] = [];

              if (sessionArray.length > 1) {
                const previousSession: any = sessionArray[1];
                const previous1RM = previousSession.attempts.reduce((max: any, curr: any) => 
                  curr.weight_kg > max.weight_kg ? curr : max
                );
                
                if (previous1RM.weight_kg > 0) {
                  percentageChange = ((latest1RM.weight_kg - previous1RM.weight_kg) / previous1RM.weight_kg) * 100;
                }

                // Add up to 3 previous sessions to history
                for (let i = 1; i < Math.min(sessionArray.length, 4); i++) {
                  const session: any = sessionArray[i];
                  const sessionMax = session.attempts.reduce((max: any, curr: any) => 
                    curr.weight_kg > max.weight_kg ? curr : max
                  );
                  history.push({
                    weight: sessionMax.weight_kg,
                    velocity: sessionMax.velocity_ms,
                    date: session.date
                  });
                }
              }

              workoutStatsData.progress.strength[exerciseName] = {
                latest1RM: latest1RM.weight_kg,
                latestVelocity: latest1RM.velocity_ms,
                latestDate: latestSession.date,
                percentageChange,
                history
              };
            }
          });
        }

        // Fetch Progress Data - Anthropometric
        const { data: anthropometricTests } = await supabase
          .from('anthropometric_test_data')
          .select(`
            weight,
            height,
            body_fat_percentage,
            muscle_mass_percentage,
            anthropometric_test_sessions!inner (
              user_id,
              test_date
            )
          `)
          .eq('anthropometric_test_sessions.user_id', userId)
          .order('anthropometric_test_sessions.test_date', { ascending: false })
          .limit(1);

        if (anthropometricTests && anthropometricTests.length > 0) {
          const latest = anthropometricTests[0];
          workoutStatsData.progress.anthropometric = {
            weight: latest.weight || undefined,
            height: latest.height || undefined,
            bodyFat: latest.body_fat_percentage || undefined,
            muscleMass: latest.muscle_mass_percentage || undefined,
            lastMeasurement: (latest as any).anthropometric_test_sessions.test_date
          };
        }

        // Fetch Progress Data - Endurance
        const { data: enduranceTests } = await supabase
          .from('endurance_test_data')
          .select(`
            vo2_max,
            push_ups,
            pull_ups,
            endurance_test_sessions!inner (
              user_id,
              test_date
            )
          `)
          .eq('endurance_test_sessions.user_id', userId)
          .order('endurance_test_sessions.test_date', { ascending: false })
          .limit(1);

        if (enduranceTests && enduranceTests.length > 0) {
          const latest = enduranceTests[0];
          workoutStatsData.progress.endurance = {
            vo2Max: latest.vo2_max || undefined,
            pushUps: latest.push_ups || undefined,
            pullUps: latest.pull_ups || undefined,
            lastMeasurement: (latest as any).endurance_test_sessions.test_date
          };
        }

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
