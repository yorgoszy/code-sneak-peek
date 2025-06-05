
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
        programsCount: 0, // Πάντα 0 αφού δεν υπάρχουν πλέον προγράμματα
        testsCount: testsCount || 0,
        paymentsCount: paymentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
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
    programs, // Πάντα κενός πίνακας
    tests,
    payments
  };
};
