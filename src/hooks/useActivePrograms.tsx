
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

      // First, fetch program assignments with basic program info only
      const { data: assignments, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(
            id,
            name,
            description
          )
        `)
        .eq('athlete_id', userData.id)
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('❌ Error fetching program assignments:', assignmentsError);
        setPrograms([]);
        return;
      }

      console.log('📊 Program assignments fetched:', assignments);

      if (!assignments || assignments.length === 0) {
        console.log('⚠️ No program assignments found for athlete_id:', userData.id);
        setPrograms([]);
        return;
      }

      // Now fetch detailed program structure for each program separately
      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          if (!assignment.programs || !assignment.program_id) {
            console.log('❌ Assignment without valid program:', assignment.id);
            return assignment;
          }

          try {
            // Fetch program weeks
            const { data: weeks, error: weeksError } = await supabase
              .from('program_weeks')
              .select('*')
              .eq('program_id', assignment.program_id)
              .order('week_number');

            if (weeksError) {
              console.error('❌ Error fetching weeks for program:', assignment.program_id, weeksError);
              return assignment;
            }

            // Fetch days for each week
            const weeksWithDays = await Promise.all(
              (weeks || []).map(async (week) => {
                const { data: days, error: daysError } = await supabase
                  .from('program_days')
                  .select('*')
                  .eq('week_id', week.id)
                  .order('day_number');

                if (daysError) {
                  console.error('❌ Error fetching days for week:', week.id, daysError);
                  return { ...week, program_days: [] };
                }

                // Fetch blocks for each day
                const daysWithBlocks = await Promise.all(
                  (days || []).map(async (day) => {
                    const { data: blocks, error: blocksError } = await supabase
                      .from('program_blocks')
                      .select('*')
                      .eq('day_id', day.id)
                      .order('block_order');

                    if (blocksError) {
                      console.error('❌ Error fetching blocks for day:', day.id, blocksError);
                      return { ...day, program_blocks: [] };
                    }

                    return { ...day, program_blocks: blocks || [] };
                  })
                );

                return { ...week, program_days: daysWithBlocks };
              })
            );

            // Update the assignment with enriched program data
            return {
              ...assignment,
              programs: {
                ...assignment.programs,
                program_weeks: weeksWithDays
              }
            };
          } catch (error) {
            console.error('❌ Error enriching program data:', error);
            return assignment;
          }
        })
      );

      console.log('✅ Enriched assignments:', enrichedAssignments);

      // Filter by date
      const validPrograms = enrichedAssignments.filter(assignment => {
        if (!assignment.programs) {
          console.log('❌ Assignment without valid program:', assignment.id);
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
