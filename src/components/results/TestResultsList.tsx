
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface TestResult {
  id: string;
  test_date: string;
  test_type: string;
  user_name: string;
  user_id: string;
  notes?: string;
  exercise_count?: number;
  table_name: string;
}

export const TestResultsList = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllTests = async () => {
    try {
      setLoading(true);
      
      // Fetch strength tests
      const { data: strengthTests } = await supabase
        .from('strength_test_sessions')
        .select(`
          id,
          test_date,
          notes,
          user_id,
          app_users!user_id(name),
          strength_test_attempts(exercise_id)
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

      // Sort by date
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
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', testId);

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

  if (loading) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Φόρτωση τεστ...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle>Αποτελέσματα Τεστ</CardTitle>
      </CardHeader>
      <CardContent>
        {testResults.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Δεν βρέθηκαν τεστ
          </p>
        ) : (
          <div className="space-y-3">
            {testResults.map((test) => (
              <div key={`${test.table_name}-${test.id}`} className="border rounded-none p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="rounded-none">
                        {test.test_type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(test.test_date).toLocaleDateString('el-GR')}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">
                      {test.user_name}
                    </h4>
                    {test.notes && (
                      <p className="text-sm text-gray-600 mt-1">{test.notes}</p>
                    )}
                    {test.exercise_count !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ασκήσεις: {test.exercise_count}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTest(test.id, test.table_name)}
                      className="rounded-none text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
