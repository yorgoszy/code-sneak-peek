
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

      // Count programs created by user or assigned to user
      let programsCount = 0;
      
      if (user.role === 'trainer' || user.role === 'admin') {
        // For trainers/admins, count programs they created
        const { count } = await supabase
          .from('programs')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
        programsCount = count || 0;
      } else {
        // For all other roles, count programs assigned to them
        const { count } = await supabase
          .from('program_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        programsCount = count || 0;
      }

      // Count tests for user
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
        programsCount: programsCount,
        testsCount: testsCount || 0,
        paymentsCount: paymentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUserPrograms = async () => {
    try {
      let data = null;
      
      if (user.role === 'trainer' || user.role === 'admin') {
        // For trainers/admins, fetch programs they created with full details
        const { data: programsData } = await supabase
          .from('programs')
          .select(`
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
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        data = programsData;
      } else {
        // For all other roles, fetch programs assigned to them with full details
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
        
        // Extract programs from assignments
        data = assignmentsData?.map(assignment => assignment.programs).filter(Boolean) || [];
      }
      
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchUserTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tests:', error);
      } else {
        setTests(data || []);
      }
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

  const refetchData = () => {
    if (user && isOpen) {
      fetchUserStats();
      fetchUserPrograms();
      fetchUserTests();
      fetchUserPayments();
    }
  };

  useEffect(() => {
    refetchData();
  }, [user, isOpen]);

  return {
    stats,
    programs,
    tests,
    payments,
    refetchData
  };
};
