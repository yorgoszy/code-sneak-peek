
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
      // Έλεγχος αν ο χρήστης δημιουργήθηκε από coach
      const isCoachCreatedUser = !user?.auth_user_id && user?.coach_id;

      // Count athletes if user is trainer
      let athletesCount = 0;
      if (user.role === 'trainer') {
        const { count } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'athlete');
        athletesCount = count || 0;
      }

      // Calculate remaining training days from active program assignment
      const { data: activeAssignment } = await supabase
        .from('program_assignments')
        .select(`
          id,
          training_dates
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let remainingTrainingDays = 0;
      if (activeAssignment?.training_dates && activeAssignment.training_dates.length > 0) {
        const totalScheduledDays = activeAssignment.training_dates.length;
        
        // Get workout completions for this assignment
        const { data: completions } = await supabase
          .from('workout_completions')
          .select('status')
          .eq('assignment_id', activeAssignment.id);

        const completedDays = completions?.filter(c => c.status === 'completed').length || 0;
        const missedDays = completions?.filter(c => c.status === 'missed').length || 0;
        
        remainingTrainingDays = totalScheduledDays - (completedDays + missedDays);
        remainingTrainingDays = Math.max(0, remainingTrainingDays); // Ensure non-negative
      }

      const programsCount = remainingTrainingDays;

      // Count tests for any user role
      const { count: testsCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count receipts - διαφορετικός πίνακας για coach-created users
      let paymentsCount = 0;
      if (isCoachCreatedUser) {
        const { count } = await supabase
          .from('coach_receipts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        paymentsCount = count || 0;
      } else {
        const { count } = await supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        paymentsCount = count || 0;
      }

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
      // Έλεγχος αν ο χρήστης δημιουργήθηκε από coach
      const isCoachCreatedUser = !user?.auth_user_id && user?.coach_id;

      if (isCoachCreatedUser) {
        const { data } = await supabase
          .from('coach_receipts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        setPayments(data || []);
      } else {
        const { data } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        setPayments(data || []);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
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
