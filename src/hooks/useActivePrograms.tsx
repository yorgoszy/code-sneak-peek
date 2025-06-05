
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
            programs:program_id(
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
            app_users:user_id(
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

        console.log('✅ Fetched active programs:', assignments);
        return assignments as EnrichedAssignment[];
      } catch (error) {
        console.error('❌ Unexpected error fetching active programs:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });
};
