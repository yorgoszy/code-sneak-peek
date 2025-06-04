
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TestResult } from "../types";

export const useTestResults = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllTests = async () => {
    try {
      setLoading(true);
      
      // Fetch strength tests with attempt count
      const { data: strengthTests } = await supabase
        .from('strength_test_sessions')
        .select(`
          id,
          test_date,
          notes,
          user_id,
          app_users!user_id(name),
          strength_test_attempts(id)
        `)
        .order('test_date', { ascending: false });

      // Fetch anthropometric tests
      const { data: anthropometricTests } = await supabase
        .from('anthropometric_test_sessions')
        .select(`
          id,
          test_date,
          notes,
          user_id,
          app_users!user_id(name)
        `)
        .order('test_date', { ascending: false });

      // Fetch functional tests
      const { data: functionalTests } = await supabase
        .from('functional_test_sessions')
        .select(`
          id,
          test_date,
          notes,
          user_id,
          app_users!user_id(name)
        `)
        .order('test_date', { ascending: false });

      // Fetch endurance tests
      const { data: enduranceTests } = await supabase
        .from('endurance_test_sessions')
        .select(`
          id,
          test_date,
          notes,
          user_id,
          app_users!user_id(name)
        `)
        .order('test_date', { ascending: false });

      // Fetch jump tests
      const { data: jumpTests } = await supabase
        .from('jump_test_sessions')
        .select(`
          id,
          test_date,
          notes,
          user_id,
          app_users!user_id(name)
        `)
        .order('test_date', { ascending: false });

      // Combine all tests
      const allTests: TestResult[] = [
        ...(strengthTests?.map(test => ({
          id: test.id,
          test_date: test.test_date,
          test_type: 'Δύναμη',
          user_name: (test.app_users as any)?.name || 'Άγνωστος',
          user_id: test.user_id,
          notes: test.notes,
          exercise_count: test.strength_test_attempts?.length || 0,
          table_name: 'strength_test_sessions'
        })) || []),
        ...(anthropometricTests?.map(test => ({
          id: test.id,
          test_date: test.test_date,
          test_type: 'Σωματομετρικά',
          user_name: (test.app_users as any)?.name || 'Άγνωστος',
          user_id: test.user_id,
          notes: test.notes,
          table_name: 'anthropometric_test_sessions'
        })) || []),
        ...(functionalTests?.map(test => ({
          id: test.id,
          test_date: test.test_date,
          test_type: 'Λειτουργικότητα',
          user_name: (test.app_users as any)?.name || 'Άγνωστος',
          user_id: test.user_id,
          notes: test.notes,
          table_name: 'functional_test_sessions'
        })) || []),
        ...(enduranceTests?.map(test => ({
          id: test.id,
          test_date: test.test_date,
          test_type: 'Αντοχή',
          user_name: (test.app_users as any)?.name || 'Άγνωστος',
          user_id: test.user_id,
          notes: test.notes,
          table_name: 'endurance_test_sessions'
        })) || []),
        ...(jumpTests?.map(test => ({
          id: test.id,
          test_date: test.test_date,
          test_type: 'Άλματα',
          user_name: (test.app_users as any)?.name || 'Άγνωστος',
          user_id: test.user_id,
          notes: test.notes,
          table_name: 'jump_test_sessions'
        })) || [])
      ];

      // Sort by date (newest first)
      allTests.sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());
      
      setTestResults(allTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη φόρτωση των τεστ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (testId: string, tableName: string) => {
    try {
      let error;
      
      // Use specific table names instead of dynamic ones
      if (tableName === 'strength_test_sessions') {
        const result = await supabase
          .from('strength_test_sessions')
          .delete()
          .eq('id', testId);
        error = result.error;
      } else if (tableName === 'anthropometric_test_sessions') {
        const result = await supabase
          .from('anthropometric_test_sessions')
          .delete()
          .eq('id', testId);
        error = result.error;
      } else if (tableName === 'functional_test_sessions') {
        const result = await supabase
          .from('functional_test_sessions')
          .delete()
          .eq('id', testId);
        error = result.error;
      } else if (tableName === 'endurance_test_sessions') {
        const result = await supabase
          .from('endurance_test_sessions')
          .delete()
          .eq('id', testId);
        error = result.error;
      } else if (tableName === 'jump_test_sessions') {
        const result = await supabase
          .from('jump_test_sessions')
          .delete()
          .eq('id', testId);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το τεστ διαγράφηκε επιτυχώς"
      });

      fetchAllTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη διαγραφή του τεστ",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAllTests();
  }, []);

  return {
    testResults,
    loading,
    deleteTest,
    refetch: fetchAllTests
  };
};
