
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TestResult } from "../types";

export const useAnthropometricTestResults = (
  usersMap: Map<string, string>,
  selectedUserId?: string,
  coachUserIds?: string[],
  useCoachTables: boolean = false
) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnthroTests = useCallback(async () => {
    setLoading(true);

    const sessionsTable = useCoachTables ? 'coach_anthropometric_test_sessions' : 'anthropometric_test_sessions';
    const dataTable = useCoachTables ? 'coach_anthropometric_test_data' : 'anthropometric_test_data';

    let query = supabase
      .from(sessionsTable)
      .select('id, user_id, test_date, notes')
      .order('test_date', { ascending: false });

    // Filter by specific user if selectedUserId is provided
    if (selectedUserId) {
      query = query.eq('user_id', selectedUserId);
    } else if (coachUserIds && coachUserIds.length > 0) {
      query = query.in('user_id', coachUserIds);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching anthropometric sessions:', error);
      setLoading(false);
      return;
    }

    const newResults: TestResult[] = [];
    for (const session of sessions || []) {
      const { data: anthro } = await supabase
        .from(dataTable)
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
          table_name: sessionsTable,
          test_type: "Σωματομετρικά"
        });
      }
    }

    setResults(newResults);
    setLoading(false);
  }, [usersMap, selectedUserId, coachUserIds, useCoachTables]);

  useEffect(() => {
    fetchAnthroTests();
  }, [fetchAnthroTests]);

  return { results, loading, refetch: fetchAnthroTests };
};
