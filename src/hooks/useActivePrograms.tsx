
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
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchActivePrograms = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching active programs for user:', user?.id);
      
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('app_users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection error:', testError);
        setPrograms([]);
        setLoading(false);
        return;
      }

      console.log('✅ Supabase connection successful');

      // Fetch user data first to get the user ID from app_users
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (userError) {
        console.error('❌ Error fetching user data:', userError);
        setPrograms([]);
        return;
      }

      if (!userData) {
        console.log('⚠️ No user data found');
        setPrograms([]);
        return;
      }

      console.log('✅ Found user data:', userData);

      // Fetch active program assignments with program details
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(
            *,
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

      console.log('📊 Raw query result:', { data, error, queryCount: data?.length || 0 });

      if (error) {
        console.error('❌ Error fetching active programs:', error);
        // Fallback: try simpler query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('program_assignments')
          .select(`
            *,
            programs(*)
          `)
          .eq('athlete_id', userData.id)
          .eq('status', 'active');

        if (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          setPrograms([]);
          return;
        }

        console.log('✅ Fallback query successful:', fallbackData);
        setPrograms(fallbackData || []);
      } else {
        console.log('📋 All program assignments found:', data);
        
        if (!data || data.length === 0) {
          console.log('⚠️ No program assignments found for athlete_id:', userData.id);
          setPrograms([]);
          return;
        }

        // For debugging, let's not filter by date initially to see all assignments
        console.log('🎯 All assignments before date filtering:', data.map(a => ({
          id: a.id,
          programName: a.programs?.name,
          startDate: a.start_date,
          endDate: a.end_date,
          status: a.status
        })));

        // If no dates are set, show the program anyway
        const validPrograms = data.filter(assignment => {
          if (!assignment.programs) {
            console.log('❌ Assignment without program:', assignment.id);
            return false;
          }
          
          // If no dates are set, include the assignment
          if (!assignment.start_date || !assignment.end_date) {
            console.log('✅ Including assignment without dates:', assignment.id);
            return true;
          }
          
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          const startDate = new Date(assignment.start_date);
          const endDate = new Date(assignment.end_date);
          
          // Program is active if:
          // 1. It has started and not ended (active)
          // 2. It starts within the next week (coming soon)
          const isActive = startDate <= today && endDate >= today;
          const isComingSoon = startDate > today && startDate <= nextWeek;
          
          console.log('📊 Date check for assignment:', assignment.id, {
            startDate: assignment.start_date,
            endDate: assignment.end_date,
            isActive,
            isComingSoon,
            willInclude: isActive || isComingSoon
          });
          
          return isActive || isComingSoon;
        });
        
        console.log('✅ Final filtered programs:', validPrograms.length, validPrograms);
        setPrograms(validPrograms);
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching active programs:', error);
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
