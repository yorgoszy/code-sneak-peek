
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { testSupabaseConnection, fetchUserData, fetchProgramAssignments, enrichAssignmentWithProgramData } from "./useActivePrograms/dataService";
import { isValidAssignment } from "./useActivePrograms/dateFilters";
import type { EnrichedAssignment } from "./useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";

export const useActivePrograms = () => {
  const [programs, setPrograms] = useState<EnrichedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    // 🔍 STEP 1: Show current user's auth_user_id
    console.log('=== USER DEBUG INFO ===');
    console.log('1. Current user from useAuth:', user);
    console.log('2. Auth user ID:', user?.id);
    console.log('3. User email:', user?.email);
    
    if (user?.id) {
      fetchActivePrograms();
    } else {
      console.log('⚠️ No user found, setting loading to false');
      setLoading(false);
    }
  }, [user]);

  const calculateProgress = async (assignment: EnrichedAssignment) => {
    try {
      if (!assignment.training_dates || assignment.training_dates.length === 0) {
        return 0;
      }

      const completions = await getWorkoutCompletions(assignment.id);
      const completedWorkouts = completions.filter(c => c.status === 'completed').length;
      const totalWorkouts = assignment.training_dates.length;
      
      const progress = Math.round((completedWorkouts / totalWorkouts) * 100);
      console.log(`📊 Progress for assignment ${assignment.id}: ${completedWorkouts}/${totalWorkouts} = ${progress}%`);
      
      return progress;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  const fetchActivePrograms = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('❌ No user ID available');
        setPrograms([]);
        return;
      }

      console.log('🔍 Fetching active programs for user:', user.id);
      
      // Test Supabase connection first
      const connectionValid = await testSupabaseConnection();
      if (!connectionValid) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      // 🔍 STEP 2: Check if user exists in app_users table
      console.log('=== APP_USERS TABLE DEBUG ===');
      const userData = await fetchUserData(user.id);
      console.log('4. userData from app_users table:', userData);
      
      if (!userData || !userData.id) {
        console.log('⚠️ No valid userData found or missing userData.id');
        console.log('5. This means the user does NOT exist in app_users table with auth_user_id:', user.id);
        setPrograms([]);
        return;
      }

      console.log('✅ Valid userData found:', userData);
      console.log('6. User exists in app_users with ID:', userData.id);

      // 🔍 STEP 3: Check program_assignments table
      console.log('=== PROGRAM_ASSIGNMENTS TABLE DEBUG ===');
      const assignments = await fetchProgramAssignments(userData.id);
      console.log('7. Raw assignments from program_assignments table:', assignments);
      
      if (assignments) {
        assignments.forEach((assignment, index) => {
          console.log(`8.${index + 1}. Assignment ID: ${assignment.id}`);
          console.log(`   - user_id: ${assignment.user_id}`);
          console.log(`   - program_id: ${assignment.program_id}`);
          console.log(`   - start_date: ${assignment.start_date} (type: ${typeof assignment.start_date})`);
          console.log(`   - end_date: ${assignment.end_date} (type: ${typeof assignment.end_date})`);
          console.log(`   - status: ${assignment.status}`);
          console.log(`   - created_at: ${assignment.created_at}`);
        });
      }
      
      if (!assignments) {
        setPrograms([]);
        return;
      }

      if (assignments.length === 0) {
        console.log('9. No assignments found for user_id:', userData.id);
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
      
      // Calculate progress for each program
      const programsWithProgress = await Promise.all(
        validPrograms.map(async (program) => {
          const progress = await calculateProgress(program);
          return { ...program, progress };
        })
      );
      
      console.log('✅ Final filtered programs with progress:', programsWithProgress.length, programsWithProgress);
      setPrograms(programsWithProgress);

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
