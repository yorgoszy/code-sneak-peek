
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
  const [visits, setVisits] = useState<any[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserStats();
      fetchUserPrograms();
      fetchUserTests();
      fetchUserPayments();
      fetchUserVisits();
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

      // Count total training days from all assigned programs
      const { data: assignmentsWithPrograms } = await supabase
        .from('program_assignments')
        .select(`
          program_id,
          programs!program_assignments_program_id_fkey(
            program_weeks(
              program_days(id)
            )
          )
        `)
        .eq('user_id', user.id);

      let totalTrainingDays = 0;
      assignmentsWithPrograms?.forEach(assignment => {
        if (assignment.programs?.program_weeks) {
          assignment.programs.program_weeks.forEach((week: any) => {
            if (week.program_days) {
              totalTrainingDays += week.program_days.length;
            }
          });
        }
      });

      const programsCount = totalTrainingDays;

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
        // Check if programs exists and is a valid object (not null, not array)
        if (!assignment.programs || 
            assignment.programs === null || 
            Array.isArray(assignment.programs) ||
            typeof assignment.programs !== 'object') {
          return null;
        }
        
        // Type assertion to ensure TypeScript knows this is an object
        const programData = assignment.programs as Record<string, any>;
        
        return {
          ...programData,
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

  const fetchUserVisits = async () => {
    try {
      const { data } = await supabase
        .from('user_visits')
        .select('*')
        .eq('user_id', user.id)
        .order('visit_date', { ascending: false });
      
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  return {
    stats,
    programs,
    tests,
    payments,
    visits
  };
};
