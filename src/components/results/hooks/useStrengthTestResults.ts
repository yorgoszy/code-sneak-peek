
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TestResult } from "../types";

export const useStrengthTestResults = (usersMap: Map<string, string>) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStrengthTests() {
      const { data: sessions, error } = await supabase
        .from('test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });
      if (error) return setLoading(false);

      let newResults: TestResult[] = [];
      for (const session of sessions || []) {
        const { data: strengthData } = await supabase
          .from('strength_test_data')
          .select('id,exercise_id')
          .eq('test_session_id', session.id);

        if (Array.isArray(strengthData) && strengthData.length > 0) {
          // Count unique exercises for strength
          const exerciseIds = new Set(strengthData.map(e => e.exercise_id));
          newResults.push({
            id: session.id,
            test_date: session.test_date,
            user_name: usersMap.get(session.user_id) || "Άγνωστος Χρήστης",
            user_id: session.user_id,
            notes: session.notes,
            table_name: "test_sessions",
            test_type: "Δύναμη",
            exercise_count: exerciseIds.size,
          });
        }
      }
      setResults(newResults);
      setLoading(false);
    }
    fetchStrengthTests();
  }, [usersMap]);

  return { results, loading };
};
