
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TestResult } from "../types";

export const useJumpTestResults = (usersMap: Map<string, string>) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJumpTests() {
      const { data: sessions, error } = await supabase
        .from('test_sessions')
        .select('id, user_id, test_date, notes')
        .order('test_date', { ascending: false });
      if (error) return setLoading(false);

      let newResults: TestResult[] = [];
      for (const session of sessions || []) {
        const { data: jump } = await supabase
          .from('jump_test_data')
          .select('id')
          .eq('test_session_id', session.id)
          .maybeSingle();
        if (jump) {
          newResults.push({
            id: session.id,
            test_date: session.test_date,
            user_name: usersMap.get(session.user_id) || "Άγνωστος Χρήστης",
            user_id: session.user_id,
            notes: session.notes,
            table_name: "test_sessions",
            test_type: "Άλματα"
          });
        }
      }
      setResults(newResults);
      setLoading(false);
    }
    fetchJumpTests();
  }, [usersMap]);

  return { results, loading };
};
