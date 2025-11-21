import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardData = (userId: string) => {
  const [stats, setStats] = useState({
    programsCount: 0,
    testsCount: 0,
    paymentsCount: 0
  });
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch only essential data in parallel
      const [
        activeAssignmentResult,
        testsCountResult,
        paymentsCountResult,
        programsResult
      ] = await Promise.all([
        // Get active assignment for remaining training days
        supabase
          .from('program_assignments')
          .select('id, training_dates')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        
        // Count tests
        supabase
          .from('tests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Count receipts
        supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Get only active programs with minimal data
        supabase
          .from('program_assignments')
          .select(`
            id,
            status,
            start_date,
            training_dates,
            programs(
              id,
              name,
              description
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
      ]);

      // Calculate remaining training days
      let remainingTrainingDays = 0;
      if (activeAssignmentResult.data?.training_dates) {
        const totalScheduledDays = activeAssignmentResult.data.training_dates.length;
        
        const { data: completions } = await supabase
          .from('workout_completions')
          .select('status', { count: 'exact', head: true })
          .eq('assignment_id', activeAssignmentResult.data.id)
          .in('status', ['completed', 'missed']);

        const completedAndMissed = completions?.length || 0;
        remainingTrainingDays = Math.max(0, totalScheduledDays - completedAndMissed);
      }

      setStats({
        programsCount: remainingTrainingDays,
        testsCount: testsCountResult.count || 0,
        paymentsCount: paymentsCountResult.count || 0
      });

      setPrograms(programsResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    programs,
    loading
  };
};
