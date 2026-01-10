import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FMSTestType } from '@/services/exerciseAnalyzer';

interface SaveTestResultParams {
  userId: string;
  testType: FMSTestType;
  testSide?: 'left' | 'right' | null;
  score: 0 | 1 | 2 | 3;
  feedback: string;
}

interface TestResult {
  id: string;
  user_id: string;
  test_type: string;
  test_side: string | null;
  score: number;
  feedback: string | null;
  video_url: string | null;
  test_date: string;
  created_at: string;
}

export const useAICoachResults = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  // Save a new test result
  const saveTestResult = useCallback(async ({
    userId,
    testType,
    testSide,
    score,
    feedback
  }: SaveTestResultParams): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_coach_test_results')
        .insert({
          user_id: userId,
          test_type: testType,
          test_side: testSide || null,
          score,
          feedback
        });

      if (error) throw error;
      
      toast.success('Το αποτέλεσμα αποθηκεύτηκε επιτυχώς');
      return true;
    } catch (error) {
      console.error('Error saving test result:', error);
      toast.error('Σφάλμα αποθήκευσης αποτελέσματος');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Fetch results for a specific user
  const fetchUserResults = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_coach_test_results')
        .select('*')
        .eq('user_id', userId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      
      setResults(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Σφάλμα φόρτωσης αποτελεσμάτων');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch latest result for a specific test type
  const getLatestResult = useCallback(async (userId: string, testType: FMSTestType) => {
    try {
      const { data, error } = await supabase
        .from('ai_coach_test_results')
        .select('*')
        .eq('user_id', userId)
        .eq('test_type', testType)
        .order('test_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching latest result:', error);
      return null;
    }
  }, []);

  // Get FMS summary (all 7 tests with latest scores)
  const getFMSSummary = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const fmsTests: FMSTestType[] = [
        'deep-squat',
        'hurdle-step',
        'inline-lunge',
        'shoulder-mobility',
        'active-straight-leg-raise',
        'trunk-stability-pushup',
        'rotary-stability'
      ];

      const summary: Record<string, { score: number; date: string } | null> = {};
      
      for (const test of fmsTests) {
        const result = await getLatestResult(userId, test);
        summary[test] = result ? { score: result.score, date: result.test_date } : null;
      }

      // Calculate total FMS score
      const scores = Object.values(summary).filter(s => s !== null).map(s => s!.score);
      const totalScore = scores.reduce((a, b) => a + b, 0);
      const maxScore = scores.length * 3;

      return {
        tests: summary,
        totalScore,
        maxScore,
        testsCompleted: scores.length,
        totalTests: fmsTests.length
      };
    } catch (error) {
      console.error('Error fetching FMS summary:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getLatestResult]);

  return {
    saving,
    loading,
    results,
    saveTestResult,
    fetchUserResults,
    getLatestResult,
    getFMSSummary
  };
};
