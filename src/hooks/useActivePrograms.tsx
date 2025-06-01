
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useActivePrograms = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchActivePrograms();
    }
  }, [user]);

  const fetchActivePrograms = async () => {
    try {
      setLoading(true);
      console.log('Fetching active programs for user:', user?.id);
      
      // Fetch user data first to get the user ID from app_users
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        setPrograms([]);
        return;
      }

      if (!userData) {
        console.log('No user data found');
        setPrograms([]);
        return;
      }

      console.log('Found user data:', userData);

      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekDate = nextWeek.toISOString().split('T')[0];

      console.log('Date filters:', { today, nextWeekDate });

      // Fetch active program assignments and coming soon programs
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(
            *,
            app_users!programs_created_by_fkey(name),
            program_weeks(
              *,
              program_days(
                *,
                program_blocks(
                  *,
                  program_exercises(
                    *,
                    exercises(name)
                  )
                )
              )
            )
          )
        `)
        .eq('athlete_id', userData.id)
        .eq('status', 'active');

      console.log('Raw query result:', { data, error });

      if (error) {
        console.error('Error fetching active programs:', error);
        setPrograms([]);
      } else {
        console.log('Fetched programs:', data);
        
        // Filter programs that are active today or start within next week
        const filteredPrograms = (data || []).filter(assignment => {
          if (!assignment.start_date || !assignment.end_date) {
            console.log('Assignment missing dates:', assignment);
            return false;
          }

          const startDate = new Date(assignment.start_date);
          const endDate = new Date(assignment.end_date);
          const todayDate = new Date(today);
          const nextWeekDateObj = new Date(nextWeekDate);
          
          // Program is active if:
          // 1. It has started and not ended (active)
          // 2. It starts within the next week (coming soon)
          const isActive = startDate <= todayDate && endDate >= todayDate;
          const isComingSoon = startDate > todayDate && startDate <= nextWeekDateObj;
          
          console.log('Assignment filter check:', {
            assignment: assignment.id,
            programName: assignment.programs?.name,
            startDate: assignment.start_date,
            endDate: assignment.end_date,
            isActive,
            isComingSoon,
            willInclude: isActive || isComingSoon
          });
          
          return isActive || isComingSoon;
        });
        
        console.log('Filtered programs:', filteredPrograms);
        setPrograms(filteredPrograms);
      }
    } catch (error) {
      console.error('Error fetching active programs:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    programs,
    loading,
    refetch: fetchActivePrograms
  };
};
