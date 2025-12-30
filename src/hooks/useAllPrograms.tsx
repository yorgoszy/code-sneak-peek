import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EnrichedAssignment } from './useActivePrograms/types';

export const useAllPrograms = () => {
  return useQuery({
    queryKey: ['all-programs', 'v2'],
    queryFn: async (): Promise<EnrichedAssignment[]> => {
      console.log('🔄 Fetching ALL programs from database...');
      
      try {
        // Fetch ALL program assignments (both active and completed)
        const { data: assignments, error: assignmentsError } = await supabase
          .from('program_assignments')
          .select('*')
          .in('status', ['active', 'completed']); // Include both active and completed

        if (assignmentsError) {
          console.error('❌ Error fetching program assignments:', assignmentsError);
          throw assignmentsError;
        }

        console.log('✅ Raw assignments data:', assignments);

        if (!assignments || assignments.length === 0) {
          return [];
        }

        // Fetch related programs separately with explicit foreign key hints
        const programIds = assignments.map(a => a.program_id).filter(Boolean);
        const { data: programs, error: programsError } = await supabase
          .from('programs')
          .select(`
            id,
            name,
            description,
            training_days,
            program_weeks!fk_program_weeks_program_id(
              id,
              name,
              week_number,
              program_days!fk_program_days_week_id(
                id,
                name,
                day_number,
                estimated_duration_minutes,
                is_test_day,
                test_types,
                is_competition_day,
                program_blocks!fk_program_blocks_day_id(
                  id,
                  name,
                  block_order,
                  training_type,
                  workout_format,
                  workout_duration,
                  block_sets,
                  program_exercises!fk_program_exercises_block_id(
                    id,
                    exercise_id,
                    sets,
                    reps,
                    reps_mode,
                    kg,
                    kg_mode,
                    percentage_1rm,
                    velocity_ms,
                    tempo,
                    rest,
                    notes,
                    exercise_order,
                    exercises!fk_program_exercises_exercise_id(
                      id,
                      name,
                      description,
                      video_url
                    )
                  )
                )
              )
            )
          `)
          .in('id', programIds);

        if (programsError) {
          console.error('❌ Error fetching programs:', programsError);
          throw programsError;
        }

        // Fetch related users separately
        const userIds = assignments.map(a => a.user_id).filter(Boolean);
        const { data: users, error: usersError } = await supabase
          .from('app_users')
          .select('id, name, email, photo_url')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ Error fetching users:', usersError);
          throw usersError;
        }

        // Combine the data manually
        const enrichedAssignments: EnrichedAssignment[] = assignments.map(assignment => {
          const program = programs?.find(p => p.id === assignment.program_id);
          const user = users?.find(u => u.id === assignment.user_id);

          return {
            id: assignment.id,
            program_id: assignment.program_id,
            user_id: assignment.user_id,
            assigned_by: assignment.assigned_by,
            start_date: assignment.start_date,
            end_date: assignment.end_date,
            status: assignment.status,
            notes: assignment.notes,
            created_at: assignment.created_at,
            updated_at: assignment.updated_at,
            assignment_type: assignment.assignment_type,
            group_id: assignment.group_id,
            progress: assignment.progress,
            training_dates: assignment.training_dates,
            programs: program ? {
              id: program.id,
              name: program.name,
              description: program.description,
              training_days: typeof program.training_days === 'number' 
                ? [] 
                : program.training_days || [],
              program_weeks: program.program_weeks || []
            } : undefined,
            app_users: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              photo_url: user.photo_url
            } : null
          };
        });

        console.log('✅ All enriched assignments:', enrichedAssignments);
        return enrichedAssignments;
      } catch (error) {
        console.error('❌ Unexpected error fetching all programs:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};