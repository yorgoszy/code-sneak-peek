
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { testSupabaseConnection, fetchUserData, fetchProgramAssignments, enrichAssignmentWithProgramData } from "./useActivePrograms/dataService";
import { isValidAssignment } from "./useActivePrograms/dateFilters";
import type { EnrichedAssignment } from "./useActivePrograms/types";

export const useActivePrograms = () => {
  const [programs, setPrograms] = useState<EnrichedAssignment[]>([]);
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
      const connectionValid = await testSupabaseConnection();
      if (!connectionValid) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      // Fetch user data first to get the user ID from app_users
      const userData = await fetchUserData(user?.id);
      if (!userData) {
        setPrograms([]);
        return;
      }

      // Fetch program assignments
      const assignments = await fetchProgramAssignments(userData.id);
      if (!assignments) {
        setPrograms([]);
        return;
      }

      if (assignments.length === 0) {
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
