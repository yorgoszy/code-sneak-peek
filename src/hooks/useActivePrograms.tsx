
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { testSupabaseConnection, fetchUserData, fetchProgramAssignments, enrichAssignmentWithProgramData } from "./useActivePrograms/dataService";
import { isValidAssignment } from "./useActivePrograms/dateFilters";
import type { EnrichedAssignment } from "./useActivePrograms/types";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { supabase } from "@/integrations/supabase/client";

export const useActivePrograms = (includeCompleted: boolean = false) => {
  const [programs, setPrograms] = useState<EnrichedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { fetchMultipleCompletions, calculateWorkoutStats, clearCache, getWorkoutCompletions } = useWorkoutCompletionsCache();

  useEffect(() => {
    console.log('=== USER DEBUG INFO ===');
    console.log('1. Current user from useAuth:', user);
    console.log('2. Auth user ID:', user?.id);
    console.log('3. User email:', user?.email);
    console.log('4. Include completed programs:', includeCompleted);
    
    if (user?.id) {
      fetchActivePrograms();
    } else {
      console.log('⚠️ No user found, setting loading to false');
      setLoading(false);
    }
  }, [user, includeCompleted]);

  // Απλοποιημένο real-time updates - μόνο για workout completions
  useEffect(() => {
    if (!user?.id || programs.length === 0) return;

    console.log('🔄 Setting up real-time updates for workout completions');
    
    const channel = supabase
      .channel('workout-completions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        async (payload) => {
          console.log('📊 Workout completion changed:', payload);
          
          // Καθαρίζουμε το cache και ξαναφορτώνουμε
          clearCache();
          await fetchActivePrograms();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, programs.length]);

  const fetchActivePrograms = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('❌ No user ID available');
        setPrograms([]);
        return;
      }

      console.log('🔍 Fetching programs for user:', user.id, 'includeCompleted:', includeCompleted);
      
      // Test Supabase connection first
      const connectionValid = await testSupabaseConnection();
      if (!connectionValid) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      // Check if user exists in app_users table
      const userData = await fetchUserData(user.id);
      console.log('User data from app_users table:', userData);
      
      if (!userData || !userData.id) {
        console.log('⚠️ No valid userData found or missing userData.id');
        setPrograms([]);
        return;
      }

      // Fetch program assignments
      const assignments = await fetchProgramAssignments(userData.id);
      console.log('Raw assignments from program_assignments table:', assignments);
      
      if (!assignments || assignments.length === 0) {
        console.log('No assignments found for user_id:', userData.id);
        setPrograms([]);
        return;
      }

      // Enrich assignments with program data
      const enrichedAssignments = await Promise.all(
        assignments.map(enrichAssignmentWithProgramData)
      );

      console.log('✅ Enriched assignments:', enrichedAssignments);

      // Filter by date - only include assignments that have program data
      const validPrograms = enrichedAssignments.filter(isValidAssignment);
      
      // Bulk fetch όλων των workout completions με ένα query
      const assignmentIds = validPrograms.map(p => p.id);
      await fetchMultipleCompletions(assignmentIds);
      
      // Calculate progress for each program using cached data
      const programsWithProgress = await Promise.all(
        validPrograms.map(async (program) => {
          const completions = await getWorkoutCompletions(program.id);
          const stats = calculateWorkoutStats(completions, program.training_dates || []);
          return { ...program, progress: stats.progress };
        })
      );
      
      // Φιλτράρισμα ανάλογα με το includeCompleted flag
      const finalPrograms = includeCompleted 
        ? programsWithProgress 
        : programsWithProgress.filter(program => program.progress < 100);
      
      console.log('✅ Final programs:', includeCompleted ? 'all programs' : 'active only', finalPrograms.length);
      setPrograms(finalPrograms);

    } catch (error) {
      console.error('❌ Unexpected error fetching programs:', error);
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
