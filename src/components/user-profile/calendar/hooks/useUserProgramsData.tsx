
import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { fetchProgramAssignments, enrichAssignmentWithProgramData } from "@/hooks/useActivePrograms/dataService";
import { isValidAssignment } from "@/hooks/useActivePrograms/dateFilters";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export const useUserProgramsData = (user: any) => {
  const [programs, setPrograms] = useState<EnrichedAssignment[]>([]);
  const [allCompletions, setAllCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  const fetchUserPrograms = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching ALL programs for user (including completed):', user.id);
      
      const assignments = await fetchProgramAssignments(user.id);
      
      if (!assignments || assignments.length === 0) {
        console.log('⚠️ No assignments found for user:', user.id);
        setPrograms([]);
        return;
      }

      const enrichedAssignments = await Promise.all(
        assignments.map(enrichAssignmentWithProgramData)
      );

      const validPrograms = enrichedAssignments.filter(isValidAssignment);
      
      console.log('✅ User programs loaded (all including completed):', validPrograms.length);
      setPrograms(validPrograms);

    } catch (error) {
      console.error('❌ Error fetching user programs:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutStatus = (program: EnrichedAssignment, dayString: string) => {
    const completion = allCompletions.find(c => 
      c.assignment_id === program.id && 
      c.scheduled_date === dayString
    );

    if (completion) {
      return completion.status;
    }

    return 'scheduled';
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserPrograms();
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchAllCompletions = async () => {
      if (programs.length === 0) {
        setAllCompletions([]);
        return;
      }

      console.log('🔄 Fetching completions for user programs:', programs.length);
      const completionsData: any[] = [];
      
      for (const program of programs) {
        try {
          const completions = await getWorkoutCompletions(program.id);
          completionsData.push(...completions.map(c => ({ ...c, assignment_id: program.id })));
        } catch (error) {
          console.error('❌ Error fetching completions for program:', program.id, error);
        }
      }
      
      setAllCompletions(completionsData);
    };

    fetchAllCompletions();
  }, [programs, getWorkoutCompletions]);

  useEffect(() => {
    if (!user?.id || programs.length === 0) return;

    console.log('🔄 Setting up real-time updates for user profile calendar');
    
    const channel = supabase
      .channel('user-profile-workout-completions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        async (payload) => {
          console.log('📊 User profile workout completion changed:', payload);
          
          const completionsData: any[] = [];
          for (const program of programs) {
            try {
              const completions = await getWorkoutCompletions(program.id);
              completionsData.push(...completions.map(c => ({ ...c, assignment_id: program.id })));
            } catch (error) {
              console.error('❌ Error fetching completions for program:', program.id, error);
            }
          }
          setAllCompletions(completionsData);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up user profile real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, programs, getWorkoutCompletions]);

  return {
    programs,
    allCompletions,
    loading,
    getWorkoutStatus,
    handleRefresh: fetchUserPrograms
  };
};
