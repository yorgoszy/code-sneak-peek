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

      // 1. Φέρνουμε από τους νέους πίνακες των τεστ
      
      // Strength Test Sessions
      const { data: strengthSessions, error: strengthError } = await supabase
        .from('strength_test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });

      if (!strengthError && strengthSessions) {
        console.log('💪 Found strength test sessions:', strengthSessions.length);
        
        for (const session of strengthSessions) {
          // Φέρνουμε τις προσπάθειες για αυτό το session
          const { data: attempts } = await supabase
            .from('strength_test_attempts')
            .select('exercise_id')
            .eq('test_session_id', session.id);

          const exerciseIds = new Set(attempts?.map(a => a.exercise_id) || []);
          const userName = usersMap.get(session.user_id) || "Άγνωστος Χρήστης";

          results.push({
            id: session.id,
            test_date: session.test_date,
            user_name: userName,
            user_id: session.user_id,
            notes: session.notes,
            table_name: "strength_test_sessions",
            test_type: "Δύναμη",
            exercise_count: exerciseIds.size
          });
        }
      }

      // Anthropometric Test Sessions
      const { data: anthropometricSessions, error: anthropometricError } = await supabase
        .from('anthropometric_test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });

      if (!anthropometricError && anthropometricSessions) {
        console.log('📏 Found anthropometric test sessions:', anthropometricSessions.length);
        
        for (const session of anthropometricSessions) {
          const userName = usersMap.get(session.user_id) || "Άγνωστος Χρήστης";

          // Ελέγχουμε αν υπάρχουν δεδομένα για αυτό το session
          const { data: testData } = await supabase
            .from('anthropometric_test_data')
            .select('id')
            .eq('test_session_id', session.id)
            .maybeSingle();

          if (testData) {
            results.push({
              id: session.id,
              test_date: session.test_date,
              user_name: userName,
              user_id: session.user_id,
              notes: session.notes,
              table_name: "anthropometric_test_sessions",
              test_type: "Σωματομετρικά"
            });
          }
        }
      }

      // Functional Test Sessions
      const { data: functionalSessions, error: functionalError } = await supabase
        .from('functional_test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });

      if (!functionalError && functionalSessions) {
        console.log('🏃 Found functional test sessions:', functionalSessions.length);
        
        for (const session of functionalSessions) {
          const userName = usersMap.get(session.user_id) || "Άγνωστος Χρήστης";

          // Ελέγχουμε αν υπάρχουν δεδομένα για αυτό το session
          const { data: testData } = await supabase
            .from('functional_test_data')
            .select('id')
            .eq('test_session_id', session.id)
            .maybeSingle();

          if (testData) {
            results.push({
              id: session.id,
              test_date: session.test_date,
              user_name: userName,
              user_id: session.user_id,
              notes: session.notes,
              table_name: "functional_test_sessions",
              test_type: "Λειτουργικότητα"
            });
          }
        }
      }

      // Endurance Test Sessions
      const { data: enduranceSessions, error: enduranceError } = await supabase
        .from('endurance_test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });

      if (!enduranceError && enduranceSessions) {
        console.log('🏃‍♂️ Found endurance test sessions:', enduranceSessions.length);
        
        for (const session of enduranceSessions) {
          const userName = usersMap.get(session.user_id) || "Άγνωστος Χρήστης";

          // Ελέγχουμε αν υπάρχουν δεδομένα για αυτό το session
          const { data: testData } = await supabase
            .from('endurance_test_data')
            .select('id')
            .eq('test_session_id', session.id)
            .maybeSingle();

          if (testData) {
            results.push({
              id: session.id,
              test_date: session.test_date,
              user_name: userName,
              user_id: session.user_id,
              notes: session.notes,
              table_name: "endurance_test_sessions",
              test_type: "Αντοχή"
            });
          }
        }
      }

      // Jump Test Sessions
      const { data: jumpSessions, error: jumpError } = await supabase
        .from('jump_test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });

      if (!jumpError && jumpSessions) {
        console.log('🦘 Found jump test sessions:', jumpSessions.length);
        
        for (const session of jumpSessions) {
          const userName = usersMap.get(session.user_id) || "Άγνωστος Χρήστης";

          // Ελέγχουμε αν υπάρχουν δεδομένα για αυτό το session
          const { data: testData } = await supabase
            .from('jump_test_data')
            .select('id')
            .eq('test_session_id', session.id)
            .maybeSingle();

          if (testData) {
            results.push({
              id: session.id,
              test_date: session.test_date,
              user_name: userName,
              user_id: session.user_id,
              notes: session.notes,
              table_name: "jump_test_sessions",
              test_type: "Άλματα"
            });
          }
        }
      }

      // 2. Φέρνουμε από τον παλιό πίνακα test_sessions (αν υπάρχουν)
      const { data: oldSessions, error: oldSessionsError } = await supabase
        .from('test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });

      if (!oldSessionsError && oldSessions) {
        console.log('📊 Found old test sessions:', oldSessions.length);
        
        for (const session of oldSessions) {
          const promises = [
            supabase.from('anthropometric_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
            supabase.from('functional_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
            supabase.from('endurance_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
            supabase.from('jump_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
            supabase.from('strength_test_data').select('id,exercise_id').eq('test_session_id', session.id)
          ];
          
          const [{ data: anthro }, { data: func }, { data: endur }, { data: jump }, { data: strengthListData }] = await Promise.all(promises);

          const userName = usersMap.get(session.user_id) || "Άγνωστος Χρήστης";
          const common = {
            id: session.id,
            test_date: session.test_date,
            user_name: userName,
            user_id: session.user_id,
            notes: session.notes,
            table_name: "test_sessions"
          };

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
      console.log('🗑️ Deleting test:', sessionId, 'from table:', tableName);

      if (tableName === "strength_test_sessions") {
        // Διαγραφή από τον νέο πίνακα strength tests
        const { error } = await supabase
          .from('strength_test_sessions')
          .delete()
          .eq('id', sessionId);
        
        if (error) throw error;
      } else if (tableName === "anthropometric_test_sessions") {
        const { error } = await supabase
          .from('anthropometric_test_sessions')
          .delete()
          .eq('id', sessionId);
        
        if (error) throw error;
      } else if (tableName === "functional_test_sessions") {
        const { error } = await supabase
          .from('functional_test_sessions')
          .delete()
          .eq('id', sessionId);
        
        if (error) throw error;
      } else if (tableName === "endurance_test_sessions") {
        const { error } = await supabase
          .from('endurance_test_sessions')
          .delete()
          .eq('id', sessionId);
        
        if (error) throw error;
      } else if (tableName === "jump_test_sessions") {
        const { error } = await supabase
          .from('jump_test_sessions')
          .delete()
          .eq('id', sessionId);
        
        if (error) throw error;
      } else {
        // Παλιός τρόπος διαγραφής για test_sessions
        const [a, b, c, d, e] = await Promise.all([
          supabase.from('anthropometric_test_data').select('id').eq('test_session_id', sessionId).maybeSingle(),
          supabase.from('functional_test_data').select('id').eq('test_session_id', sessionId).maybeSingle(),
          supabase.from('endurance_test_data').select('id').eq('test_session_id', sessionId).maybeSingle(),
          supabase.from('jump_test_data').select('id').eq('test_session_id', sessionId).maybeSingle(),
          supabase.from('strength_test_data').select('id').eq('test_session_id', sessionId)
        ]);
        const hasAny = !!(a.data || b.data || c.data || d.data || (Array.isArray(e.data) && e.data.length));
        if (!hasAny) {
          await supabase.from('test_sessions').delete().eq('id', sessionId);
        }
      }

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
    fetchAllTests();
  }, [usersMap]);

  return {
    testResults,
    loading,
    deleteTest,
    refetch: fetchAllTests,
  };
};
