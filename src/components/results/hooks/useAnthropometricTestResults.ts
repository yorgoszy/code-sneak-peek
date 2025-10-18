
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TestResult } from "../types";

export const useAnthropometricTestResults = (usersMap: Map<string, string>) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnthroTests = useCallback(async () => {
    setLoading(true);
    const { data: sessions, error } = await supabase
      .from('anthropometric_test_sessions')
      .select('id, user_id, test_date, notes')
      .order('test_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching anthropometric sessions:', error);
      setLoading(false);
      return;
    }

    let newResults: TestResult[] = [];
    for (const session of sessions || []) {
      const { data: anthro } = await supabase
        .from('anthropometric_test_data')
        .select('id')
        .eq('test_session_id', session.id)
        .maybeSingle();
      
      if (anthro) {
        newResults.push({
          id: session.id,
          test_date: session.test_date,
          user_name: usersMap.get(session.user_id) || "Άγνωστος Χρήστης",
          user_id: session.user_id,
          notes: session.notes,
          table_name: "anthropometric_test_sessions",
          test_type: "Σωματομετρικά"
        });
      }
    }
    setResults(newResults);
    setLoading(false);
  }, [usersMap]);

  useEffect(() => {
    fetchAnthroTests();
  }, [fetchAnthroTests]);

  return { results, loading, refetch: fetchAnthroTests };
};
