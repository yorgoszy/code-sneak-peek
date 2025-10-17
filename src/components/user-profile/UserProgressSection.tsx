import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";

interface UserProgressSectionProps {
  userId: string;
}

export const UserProgressSection: React.FC<UserProgressSectionProps> = ({ userId }) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (userId && !selectedExerciseId) {
      fetchLatestExerciseForUser();
    }
  }, [userId, selectedExerciseId]);

  useEffect(() => {
    if (selectedExerciseId && userId) {
      fetchHistoricalData();
    }
  }, [selectedExerciseId, userId]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const { data, error } = await supabase
        .from('strength_test_attempts')
        .select(`
          id,
          weight_kg,
          velocity_ms,
          test_session_id,
          strength_test_sessions!inner (
            user_id,
            test_date
          )
        `)
        .eq('exercise_id', selectedExerciseId)
        .eq('strength_test_sessions.user_id', userId)
        .not('velocity_ms', 'is', null)
        .order('weight_kg', { ascending: false });

      if (error) throw error;

      const chartData = (data || []).map(attempt => ({
        exerciseName: exercises.find(e => e.id === selectedExerciseId)?.name || '',
        velocity: attempt.velocity_ms || 0,
        weight: attempt.weight_kg,
        date: attempt.strength_test_sessions.test_date
      }));

      setHistoricalData(chartData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const fetchLatestExerciseForUser = async () => {
    try {
      const { data, error } = await supabase
        .from('strength_test_attempts')
        .select(`
          exercise_id,
          created_at,
          strength_test_sessions!inner (
            user_id
          )
        `)
        .eq('strength_test_sessions.user_id', userId)
        .not('velocity_ms', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && (data[0] as any).exercise_id) {
        setSelectedExerciseId((data[0] as any).exercise_id);
      } else if (exercises.length > 0) {
        setSelectedExerciseId(exercises[0].id);
      }
    } catch (error) {
      console.error('Error fetching latest exercise for user:', error);
    }
  };

  return (
    <div className="space-y-6">
      {historicalData.length > 0 && selectedExerciseId ? (
        <LoadVelocityChart 
          data={historicalData}
          exerciseName={exercises.find(e => e.id === selectedExerciseId)?.name || ''}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          Δεν υπάρχουν δεδομένα προόδου
        </div>
      )}
    </div>
  );
};
