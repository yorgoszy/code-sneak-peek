import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TestResult } from "../types";

export const useTestResults = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // ΝΕΑ ΛΟΓΙΚΗ: συγκεντρώνει τα sessions και τα αντίστοιχα test_data με joined queries
  const fetchAllTests = async () => {
    try {
      setLoading(true);

      // Φέρνουμε όλα τα sessions, μαζί με user info
      const { data: sessions, error: sessionsError } = await supabase
        .from('test_sessions')
        .select(`
          id,
          user_id,
          test_date,
          notes,
          app_users(name)
        `)
        .order('test_date', { ascending: false });

      if (sessionsError) {
        throw sessionsError;
      }

      // Για κάθε session, βρίσκουμε ποιο test_data έχει
      // και το χαρακτηρίζουμε ως ανάλογο τύπο τεστ αν υπάρχουν δεδομένα
      let results: TestResult[] = [];
      for (const session of sessions || []) {
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
          { data: strengthList },
        ] = await Promise.all(promises);

        const userName = session.app_users?.name || "Άγνωστος Χρήστης";
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
        if (strengthList && strengthList.length > 0) {
          // Μετράμε τις unique ασκήσεις για strength
          const exerciseIds = new Set(strengthList.map(e => e.exercise_id));
          results.push({ ...common, test_type: "Δύναμη", exercise_count: exerciseIds.size });
        }
        // Εάν το session δεν έχει κανένα, δεν εμφανίζεται στη λίστα
      }

      // Φιλτράρουμε για να μην εμφανίζεται το ίδιο test_type δύο φορές για το ίδιο session
      // Αλλά εάν θέλεις να τα εμφανίζεις όλα, μπορούμε να το κρατήσουμε (σου αφήνω αυτή τη λογική - μπορείς να μου ζητήσεις να εμφανίζω μόνο ένα τύπο ανά session)

      // Ταξινομούμε κατά ημερομηνία (newest first)
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

  // Ενημερωμένη διαγραφή: διαγράφουμε τα δεδομένα που σχετίζονται με αυτό το session και το test_type
  const deleteTest = async (sessionId: string, testType: string) => {
    try {
      let error;

      if (testType === "Δύναμη") {
        // Διαγράφει όλα τα related data (προαιρετικά μπορείς να προσθέσεις cascade μέσω triggers στη ΒΔ)
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

      // Αν μετά τη διαγραφή δεν υπάρχουν άλλα test_data για το session, διαγράφουμε και το ίδιο το session
      // Φέρε τα σχετικά test_data
      const [a, b, c, d, e] = await Promise.all([
        supabase.from('anthropometric_test_data').select('id').eq('test_session_id', sessionId).maybeSingle(),
        supabase.from('functional_test_data').select('id').eq('test_session_id', sessionId).maybeSingle(),
        supabase.from('endurance_test_data').select('id').eq('test_session_id', sessionId).maybeSingle(),
        supabase.from('jump_test_data').select('id').eq('test_session_id', sessionId).maybeSingle(),
        supabase.from('strength_test_data').select('id').eq('test_session_id', sessionId)
      ]);
      const hasAny = !!(a.data || b.data || c.data || d.data || (e.data && e.data.length));
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
  }, []);

  return {
    testResults,
    loading,
    deleteTest,
    refetch: fetchAllTests,
  };
};
