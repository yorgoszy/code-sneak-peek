
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TestResult } from "../types";

/**
 * Helper to index users by id for easy lookup
 */
const useUserNamesMap = () => {
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    async function fetchUsers() {
      const { data: users, error } = await supabase
        .from('app_users')
        .select('id, name');
      if (!error && users) {
        setUsersMap(new Map(users.map(u => [u.id, u.name])));
      }
    }
    fetchUsers();
  }, []);
  return usersMap;
};

export const useTestResults = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const usersMap = useUserNamesMap();

  const fetchAllTests = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching all test results...');

      let results: TestResult[] = [];

      // Φέρνουμε ΜΟΝΟ από τον κεντρικό πίνακα test_sessions
      const { data: testSessions, error: testSessionsError } = await supabase
        .from('test_sessions')
        .select('id, user_id, test_date, notes, test_types')
        .order('test_date', { ascending: false });

      if (testSessionsError) {
        console.error('❌ Σφάλμα κατά τη φόρτωση test sessions:', testSessionsError);
        throw testSessionsError;
      }

      if (testSessions && testSessions.length > 0) {
        console.log('📊 Found test sessions:', testSessions.length);
        
        for (const session of testSessions) {
          const userName = usersMap.get(session.user_id) || "Άγνωστος Χρήστης";
          
          // Ελέγχουμε ποια τεστ έχουν δεδομένα
          const promises = [
            supabase.from('anthropometric_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
            supabase.from('functional_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
            supabase.from('endurance_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
            supabase.from('jump_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
            supabase.from('strength_test_data').select('id,exercise_id').eq('test_session_id', session.id)
          ];
          
          const [{ data: anthro }, { data: func }, { data: endur }, { data: jump }, { data: strengthListData }] = await Promise.all(promises);

          const common = {
            id: session.id,
            test_date: session.test_date,
            user_name: userName,
            user_id: session.user_id,
            notes: session.notes,
            table_name: "test_sessions"
          };

          // Δημιουργούμε ξεχωριστά entries για κάθε τύπο τεστ που έχει δεδομένα
          if (anthro) results.push({ ...common, test_type: "Σωματομετρικά" });
          if (func) results.push({ ...common, test_type: "Λειτουργικότητα" });
          if (endur) results.push({ ...common, test_type: "Αντοχή" });
          if (jump) results.push({ ...common, test_type: "Άλματα" });
          if (Array.isArray(strengthListData) && strengthListData.length > 0) {
            const exerciseIds = new Set(strengthListData.map(e => e.exercise_id));
            results.push({ ...common, test_type: "Δύναμη", exercise_count: exerciseIds.size });
          }
        }
      }

      // Ταξινόμηση όλων των αποτελεσμάτων κατά ημερομηνία
      results.sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());
      
      console.log('✅ Total test results found:', results.length);
      console.log('📋 Results by type:', results.reduce((acc, r) => {
        acc[r.test_type] = (acc[r.test_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      
      setTestResults(results);
    } catch (error) {
      console.error('❌ Error fetching test results:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη φόρτωση των τεστ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (sessionId: string, tableName: string) => {
    try {
      console.log('🗑️ Deleting test session:', sessionId);

      // Διαγραφή από τον κεντρικό πίνακα test_sessions
      // Τα σχετικά δεδομένα θα διαγραφούν αυτόματα λόγω CASCADE constraints
      const { error } = await supabase
        .from('test_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το τεστ διαγράφηκε επιτυχώς"
      });

      fetchAllTests();
    } catch (error) {
      console.error('❌ Error deleting test:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη διαγραφή του τεστ",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (usersMap.size > 0) {
      fetchAllTests();
    }
  }, [usersMap]);

  return {
    testResults,
    loading,
    deleteTest,
    refetch: fetchAllTests,
  };
};
