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
      // Only fetch 'id' and 'name'
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

      // 1. Φέρνουμε όλα τα test_sessions (χωρίς join)
      const { data: sessions, error: sessionsError } = await supabase
        .from('test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });

      if (sessionsError) {
        throw sessionsError;
      }

      let results: TestResult[] = [];
      for (const session of sessions || []) {
        // Για κάθε session, fetch individual test types
        const promises = [
          supabase.from('anthropometric_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
          supabase.from('functional_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
          supabase.from('endurance_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
          supabase.from('jump_test_data').select('id').eq('test_session_id', session.id).maybeSingle(),
          supabase.from('strength_test_data').select('id,exercise_id').eq('test_session_id', session.id)
        ];
        const [
          { data: anthro },
          { data: func },
          { data: endur },
          { data: jump },
          { data: strengthListData },
        ] = await Promise.all(promises);

        // user_name: Try to map via usersMap, else fallback to user_id
        const userName =
          usersMap && typeof usersMap.get === "function"
            ? usersMap.get(session.user_id) || "Άγνωστος Χρήστης"
            : session.user_id || "Άγνωστος Χρήστης";

        const common = {
          id: session.id,
          test_date: session.test_date,
          user_name: userName,
          user_id: session.user_id,
          notes: session.notes,
          table_name: "test_sessions"
        };

        if (anthro) {
          results.push({ ...common, test_type: "Σωματομετρικά" });
        }
        if (func) {
          results.push({ ...common, test_type: "Λειτουργικότητα" });
        }
        if (endur) {
          results.push({ ...common, test_type: "Αντοχή" });
        }
        if (jump) {
          results.push({ ...common, test_type: "Άλματα" });
        }
        // strengthListData is always array (never object/null)
        if (Array.isArray(strengthListData) && strengthListData.length > 0) {
          // Count unique exercises for strength
          const exerciseIds = new Set(strengthListData.map(e => e.exercise_id));
          results.push({ ...common, test_type: "Δύναμη", exercise_count: exerciseIds.size });
        }
      }

      results.sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());
      setTestResults(results);
    } catch (error) {
      console.error('Error fetching unified test sessions:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη φόρτωση των τεστ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Οι υπόλοιπες λειτουργίες διαγραφής/επαναφόρτωσης μένουν ίδιες
  const deleteTest = async (sessionId: string, testType: string) => {
    try {
      if (testType === "Δύναμη") {
        await supabase.from('strength_test_data').delete().eq('test_session_id', sessionId);
      } else if (testType === "Σωματομετρικά") {
        await supabase.from('anthropometric_test_data').delete().eq('test_session_id', sessionId);
      } else if (testType === "Λειτουργικότητα") {
        await supabase.from('functional_test_data').delete().eq('test_session_id', sessionId);
      } else if (testType === "Αντοχή") {
        await supabase.from('endurance_test_data').delete().eq('test_session_id', sessionId);
      } else if (testType === "Άλματα") {
        await supabase.from('jump_test_data').delete().eq('test_session_id', sessionId);
      }

      // After delete, check if no other test_data left, delete test_session
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
    // eslint-disable-next-line
  }, [usersMap]);

  return {
    testResults,
    loading,
    deleteTest,
    refetch: fetchAllTests,
  };
};
