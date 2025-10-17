import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StrengthTestChartProps {
  userId: string;
  userName: string;
}

interface ChartData {
  exerciseName: string;
  velocity: number;
  weight: number;
  date: string;
}

export const StrengthTestChart: React.FC<StrengthTestChartProps> = ({ userId, userName }) => {
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, [userId]);

  useEffect(() => {
    if (selectedExercise) {
      fetchStrengthData();
    }
  }, [selectedExercise, userId]);

  const fetchExercises = async () => {
    try {
      const { data: strengthData } = await supabase
        .from('strength_test_data')
        .select(`
          exercise_id,
          exercises(id, name),
          test_sessions!inner(user_id)
        `)
        .eq('test_sessions.user_id', userId);

      if (strengthData) {
        const uniqueExercises = Array.from(
          new Map(
            strengthData
              .filter(item => item.exercises)
              .map(item => [item.exercises.id, item.exercises])
          ).values()
        );
        setExercises(uniqueExercises);
        
        if (uniqueExercises.length > 0 && !selectedExercise) {
          setSelectedExercise(uniqueExercises[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchStrengthData = async () => {
    if (!selectedExercise) return;
    
    setLoading(true);
    try {
const { data: strengthData } = await supabase
        .from('strength_test_data')
        .select(`
          weight_kg,
          velocity_ms,
          test_sessions!test_session_id(user_id, test_date),
          exercises!exercise_id(name)
        `)
        .eq('exercise_id', selectedExercise)
        .eq('test_sessions.user_id', userId)
        .not('velocity_ms', 'is', null)
        .order('test_sessions.test_date', { ascending: true });

      if (strengthData) {
        const formattedData: ChartData[] = strengthData.map(item => ({
          exerciseName: item.exercises.name,
          velocity: item.velocity_ms,
          weight: item.weight_kg,
          date: item.test_sessions.test_date
        }));
        
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching strength data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedExerciseName = exercises.find(e => e.id === selectedExercise)?.name || "";

  return (
    <div className="space-y-4">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Καμπύλη Φορτίου-Ταχύτητας - {userName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-full rounded-none">
                <SelectValue placeholder="Επιλέξτε άσκηση" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Φόρτωση δεδομένων...</div>
          ) : chartData.length > 0 ? (
            <LoadVelocityChart 
              data={chartData} 
              selectedExercises={[selectedExerciseName]}
            />
          ) : selectedExercise ? (
            <div className="text-center py-8 text-gray-500">
              Δεν βρέθηκαν δεδομένα ταχύτητας για αυτή την άσκηση
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Επιλέξτε άσκηση για να δείτε το γράφημα
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};