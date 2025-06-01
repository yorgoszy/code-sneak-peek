
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

      // Count tests for any user role - try multiple approaches
      let testsCount = 0;
      
      // First try with user.id
      const { count: testsCount1 } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      testsCount = testsCount1 || 0;
      
      // If no results, try with auth_user_id if it exists
      if (testsCount === 0 && user.auth_user_id) {
        const { count: testsCount2 } = await supabase
          .from('tests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.auth_user_id);
        testsCount = testsCount2 || 0;
      }

      // Count payments for any user role
      const { count: paymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        athletesCount,
        programsCount: programsCount,
        testsCount: testsCount,
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
      console.log('User object:', user);
      console.log('Fetching tests for user ID:', user.id);
      console.log('User auth_user_id:', user.auth_user_id);
      
      // Try multiple approaches to find tests
      let testsData = null;
      
      // First approach: try with user.id
      const { data: data1, error: error1 } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Query 1 (user.id):', { data: data1, error: error1 });
      
      if (data1 && data1.length > 0) {
        testsData = data1;
      } else if (user.auth_user_id) {
        // Second approach: try with auth_user_id
        const { data: data2, error: error2 } = await supabase
          .from('tests')
          .select('*')
          .eq('user_id', user.auth_user_id)
          .order('created_at', { ascending: false });
        
        console.log('Query 2 (auth_user_id):', { data: data2, error: error2 });
        
        if (data2 && data2.length > 0) {
          testsData = data2;
        }
      }
      
      // Third approach: check if there are any tests with created_by matching user.id
      if (!testsData || testsData.length === 0) {
        const { data: data3, error: error3 } = await supabase
          .from('tests')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        
        console.log('Query 3 (created_by):', { data: data3, error: error3 });
        
        if (data3 && data3.length > 0) {
          testsData = data3;
        }
      }
      
      // Fourth approach: try to find tests where the user's email or name might be related
      if (!testsData || testsData.length === 0) {
        // Get all tests and see what's in the database
        const { data: allTests, error: allError } = await supabase
          .from('tests')
          .select('*')
          .limit(10);
        
        console.log('All tests sample:', { data: allTests, error: allError });
      }
      
      console.log('Final tests data:', testsData);
      setTests(testsData || []);
      
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
