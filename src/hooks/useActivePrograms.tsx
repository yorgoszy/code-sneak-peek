
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalString } from '@/utils/dateUtils';
import type { EnrichedAssignment } from './useActivePrograms/types';
import { recalculateWeeksForUser } from '@/components/programs/builder/services/perUserRecalculation';

/**
 * Hook για fetch ενεργών προγραμμάτων
 * @param coachId - ID του coach. Αν είναι null, φέρνει μόνο assignments χωρίς coach_id (για admin)
 * @param isAdmin - Αν true και coachId null, φέρνει assignments με coach_id IS NULL
 */
export const useActivePrograms = (coachId?: string | null, isAdmin: boolean = false) => {
  return useQuery({
    queryKey: ['active-programs', coachId, isAdmin],
    queryFn: async (): Promise<EnrichedAssignment[]> => {
      console.log('🔄 Fetching active programs from database...', { coachId, isAdmin });
      
      try {
        // Fetch program assignments first - include both active and completed programs for historical view
        let query = supabase
          .from('program_assignments')
          .select('*')
          .in('status', ['active', 'completed']);

        // Φιλτράρισμα με βάση το coach_id
        if (isAdmin && !coachId) {
          // Admin χωρίς coachId: φέρνει μόνο assignments χωρίς coach_id
          query = query.is('coach_id', null);
        } else if (coachId) {
          // Coach ή Admin με συγκεκριμένο coachId
          query = query.eq('coach_id', coachId);
        }
        
        const { data: assignments, error: assignmentsError } = await query;

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

        console.log('✅ Raw programs data:', programs);
        console.log('📊 Programs structure check:', programs?.map(p => ({
          id: p.id,
          name: p.name,
          weeksCount: p.program_weeks?.length,
          weeks: p.program_weeks?.map(w => ({
            id: w.id,
            name: w.name,
            week_number: w.week_number,
            daysCount: w.program_days?.length
          }))
        })));

        // Fetch related users separately
        const userIds = assignments.map(a => a.user_id).filter(Boolean);
        const { data: users, error: usersError } = await supabase
          .from('app_users')
          .select('id, name, email, photo_url, coach_id')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ Error fetching users:', usersError);
          throw usersError;
        }

        // Combine the data manually with sorted program structure
        const enrichedAssignments: EnrichedAssignment[] = assignments.map(assignment => {
          const program = programs?.find(p => p.id === assignment.program_id);
          const user = users?.find(u => u.id === assignment.user_id);

          // Deep sort the program structure to preserve intended order
          const sortedProgram = program
            ? {
                id: program.id,
                name: program.name,
                description: program.description,
                training_days:
                  typeof program.training_days === 'number'
                    ? []
                    : program.training_days || [],
                program_weeks: (program.program_weeks || [])
                  .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0))
                  .map((week: any) => ({
                    ...week,
                    program_days: (week.program_days || [])
                      .sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0))
                      .map((day: any) => ({
                        ...day,
                        program_blocks: (day.program_blocks || [])
                          .sort((a: any, b: any) => (a.block_order || 0) - (b.block_order || 0))
                          .map((block: any) => ({
                            ...block,
                            program_exercises: (block.program_exercises || [])
                              .sort((a: any, b: any) => (a.exercise_order || 0) - (b.exercise_order || 0))
                          }))
                      }))
                  }))
              }
            : undefined;

          return {
            id: assignment.id,
            program_id: assignment.program_id,
            user_id: assignment.user_id,
            assigned_by: assignment.assigned_by,
            coach_id: assignment.coach_id,
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
            programs: sortedProgram,
             app_users: user
               ? {
                   id: user.id,
                   name: user.name,
                   email: user.email,
                   photo_url: user.photo_url,
                   coach_id: (user as any).coach_id
                 }
               : null
          };
        });

        // Refresh kg/velocity per assignment from each user's latest 1RM + velocity tests
        await Promise.all(
          enrichedAssignments.map(async (ea) => {
            if (!ea.programs || !ea.user_id) return;
            try {
              const refreshedWeeks = await recalculateWeeksForUser(
                (ea.programs as any).program_weeks || [],
                ea.user_id
              );
              (ea.programs as any).program_weeks = refreshedWeeks;
            } catch (e) {
              console.warn('⚠️ Could not refresh kg for assignment', ea.id, e);
            }
          })
        );

        console.log('✅ Enriched assignments:', enrichedAssignments);
        return enrichedAssignments;
      } catch (error) {
        console.error('❌ Unexpected error fetching active programs:', error);
        throw error;
      }
    },
    staleTime: 0, // Force fresh data
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
  });
};

// Hook για αποθήκευση νέας ανάθεσης
export const useSaveAssignment = () => {
  return {
    saveAssignment: async (assignmentData: any) => {
      try {
        console.log('💾 Saving assignment to database:', assignmentData);

        // Διασφαλίζουμε ότι οι ημερομηνίες είναι σε σωστό format
        const formattedTrainingDates = assignmentData.trainingDates.map((date: Date | string) => {
          if (typeof date === 'string') {
            return date;
          }
          return formatDateToLocalString(date);
        });

        // Αποθήκευση στη βάση δεδομένων
        const { data, error } = await supabase
          .from('program_assignments')
          .insert([{
            program_id: assignmentData.program.id,
            user_id: assignmentData.userId,
            training_dates: formattedTrainingDates,
            status: 'active',
            assignment_type: 'individual',
            start_date: formattedTrainingDates[0] || formatDateToLocalString(new Date()),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (error) {
          console.error('❌ Error saving assignment:', error);
          throw error;
        }

        console.log('✅ Assignment saved successfully:', data);
        return data;
      } catch (error) {
        console.error('❌ Unexpected error saving assignment:', error);
        throw error;
      }
    }
  };
};
