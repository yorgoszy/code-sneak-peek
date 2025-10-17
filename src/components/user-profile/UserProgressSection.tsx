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
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (userId && selectedExercises.length === 0) {
      fetchLatestExerciseForUser();
    }
  }, [userId, selectedExercises]);

  useEffect(() => {
    if (selectedExercises.length > 0 && userId) {
      fetchHistoricalData();
    }
  }, [selectedExercises, userId]);

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
          exercise_id,
          test_session_id,
          strength_test_sessions!inner (
            user_id,
            test_date
          )
        `)
        .in('exercise_id', selectedExercises)
        .eq('strength_test_sessions.user_id', userId)
        .not('velocity_ms', 'is', null)
        .order('weight_kg', { ascending: false });

      if (error) throw error;

      const chartData = (data || []).map(attempt => ({
        exerciseName: exercises.find(e => e.id === attempt.exercise_id)?.name || '',
        exerciseId: attempt.exercise_id,
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Παίρνουμε όλες τις μοναδικές ασκήσεις που έχει κάνει ο χρήστης
      const uniqueExerciseIds = [...new Set((data || []).map((d: any) => d.exercise_id))];
      
      if (uniqueExerciseIds.length > 0) {
        setSelectedExercises(uniqueExerciseIds);
      } else if (exercises.length > 0) {
        setSelectedExercises([exercises[0].id]);
      }
    } catch (error) {
      console.error('Error fetching latest exercise for user:', error);
    }
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const selectAllExercises = () => {
    const userExerciseIds = [...new Set(historicalData.map(d => d.exerciseId))];
    setSelectedExercises(userExerciseIds);
  };

  const deselectAllExercises = () => {
    setSelectedExercises([]);
  };

  const availableExercises = [...new Set(historicalData.map(d => d.exerciseId))];
  const filteredData = historicalData.filter(d => selectedExercises.includes(d.exerciseId));

  return (
    <div className="space-y-6">
      {historicalData.length > 0 ? (
        <>
          {/* Φίλτρα Ασκήσεων - Compact */}
          <div className="bg-white border border-gray-200 rounded-none p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Επιλογή Ασκήσεων</span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllExercises}
                  className="text-xs px-2 py-1 bg-[#00ffba] text-black hover:bg-[#00ffba]/90 rounded-none"
                >
                  Όλες
                </button>
                <button
                  onClick={deselectAllExercises}
                  className="text-xs px-2 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-none"
                >
                  Καμία
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableExercises.map(exerciseId => {
                const exercise = exercises.find(e => e.id === exerciseId);
                const isSelected = selectedExercises.includes(exerciseId);
                return (
                  <button
                    key={exerciseId}
                    onClick={() => toggleExercise(exerciseId)}
                    className={`px-2 py-1 text-xs rounded-none transition-all ${
                      isSelected
                        ? 'bg-[#00ffba] text-black font-medium'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 opacity-50'
                    }`}
                  >
                    {exercise?.name || 'Άγνωστη άσκηση'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Γράφημα */}
          {filteredData.length > 0 ? (
            <LoadVelocityChart 
              data={filteredData}
              selectedExercises={selectedExercises.map(id => exercises.find(e => e.id === id)?.name || '')}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Επιλέξτε τουλάχιστον μία άσκηση
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Δεν υπάρχουν δεδομένα προόδου
        </div>
      )}
    </div>
  );
};
