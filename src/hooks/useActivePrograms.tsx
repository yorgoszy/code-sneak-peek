
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EnrichedAssignment } from './useActivePrograms/types';

export const useActivePrograms = () => {
  return useQuery({
    queryKey: ['active-programs'],
    queryFn: async (): Promise<EnrichedAssignment[]> => {
      console.log('🔄 Fetching active programs from database...');
      
      try {
        // Fetch program assignments with related data
        const { data: assignments, error: assignmentsError } = await supabase
          .from('program_assignments')
          .select(`
            *,
            programs!program_id(
              *,
              program_weeks(
                *,
                program_days(
                  *,
                  program_blocks(
                    *,
                    program_exercises(
                      *,
                      exercises(*)
                    )
                  )
                )
              )
            ),
            app_users!user_id(
              id,
              name,
              email,
              photo_url
            )
          `)
          .eq('status', 'active');

        if (assignmentsError) {
          console.error('❌ Error fetching program assignments:', assignmentsError);
          throw assignmentsError;
        }

        console.log('✅ Raw assignments data:', assignments);
        
        // Μετατρέπουμε τα δεδομένα στη σωστή μορφή
        const enrichedAssignments: EnrichedAssignment[] = (assignments || []).map(assignment => ({
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
          programs: assignment.programs ? {
            id: assignment.programs.id,
            name: assignment.programs.name,
            description: assignment.programs.description,
            training_days: assignment.programs.training_days,
            program_weeks: assignment.programs.program_weeks || []
          } : undefined,
          app_users: assignment.app_users ? {
            id: assignment.app_users.id,
            name: assignment.app_users.name,
            email: assignment.app_users.email,
            photo_url: assignment.app_users.photo_url
          } : null
        }));

        console.log('✅ Enriched assignments:', enrichedAssignments);
        return enrichedAssignments;
      } catch (error) {
        console.error('❌ Unexpected error fetching active programs:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
  });
};

// Hook για αποθήκευση νέας ανάθεσης
export const useSaveAssignment = () => {
  return {
    saveAssignment: async (assignmentData: any) => {
      try {
        console.log('💾 Saving assignment to database:', assignmentData);

        // Αποθήκευση στη βάση δεδομένων
        const { data, error } = await supabase
          .from('program_assignments')
          .insert([{
            program_id: assignmentData.program.id,
            user_id: assignmentData.userId,
            training_dates: assignmentData.trainingDates,
            status: 'active',
            assignment_type: 'individual',
            start_date: assignmentData.trainingDates[0] || new Date().toISOString().split('T')[0],
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
