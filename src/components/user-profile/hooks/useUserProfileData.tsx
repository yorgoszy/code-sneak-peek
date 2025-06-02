
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserProfileData = (user: any, isOpen: boolean) => {
  const [stats, setStats] = useState({
    athletesCount: 0,
    programsCount: 0,
    testsCount: 0,
    paymentsCount: 0
  });
  const [programs, setPrograms] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserStats();
      fetchUserPrograms();
      fetchUserTests();
      fetchUserPayments();
    }
  }, [user, isOpen]);

  const fetchUserStats = async () => {
    try {
      // Count athletes if user is trainer
      let athletesCount = 0;
      if (user.role === 'trainer') {
        const { count } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'athlete');
        athletesCount = count || 0;
      }

      // Count programs assigned to this specific user (regardless of their role)
      const { count: programsCount } = await supabase
        .from('program_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count tests for any user role
      const { count: testsCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count payments for any user role
      const { count: paymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        athletesCount,
        programsCount: programsCount || 0,
        testsCount: testsCount || 0,
        paymentsCount: paymentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUserPrograms = async () => {
    try {
      console.log('🔍 Fetching programs for user profile:', user.id);
      
      // Always fetch programs assigned to this specific user (regardless of role)
      const { data: assignmentsData } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(
            *,
            app_users(name),
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('📊 User profile assignments:', assignmentsData);
      
      // Extract programs from assignments and add assignment data
      const programsWithAssignments = assignmentsData?.map(assignment => {
        if (!assignment.programs || assignment.programs === null || Array.isArray(assignment.programs)) return null;
        return {
          ...assignment.programs,
          program_assignments: [assignment]
        };
      }).filter(Boolean) || [];
      
      console.log('✅ Programs for user profile:', programsWithAssignments.length);
      setPrograms(programsWithAssignments);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    }
  };

  const fetchUserTests = async () => {
    try {
      const { data } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchUserPayments = async () => {
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });
      
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  return {
    stats,
    programs,
    tests,
    payments
  };
};
