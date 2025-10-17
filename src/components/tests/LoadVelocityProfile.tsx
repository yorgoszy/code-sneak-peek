import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExerciseSelector } from "./strength/ExerciseSelector";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";

interface Attempt {
  weight_kg: number;
  velocity_ms: number;
}

interface LoadVelocityProfileProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const LoadVelocityProfile: React.FC<LoadVelocityProfileProps> = ({
  selectedAthleteId,
  selectedDate
}) => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [attempts, setAttempts] = useState<Attempt[]>([{ weight_kg: 0, velocity_ms: 0 }]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (selectedExerciseId && selectedAthleteId) {
      fetchHistoricalData();
    }
  }, [selectedExerciseId, selectedAthleteId]);

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
        .eq('strength_test_sessions.user_id', selectedAthleteId)
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

  const addAttempt = () => {
    setAttempts([...attempts, { weight_kg: 0, velocity_ms: 0 }]);
  };

  const removeAttempt = (index: number) => {
    setAttempts(attempts.filter((_, i) => i !== index));
  };

  const updateAttempt = (index: number, field: keyof Attempt, value: number) => {
    const updated = [...attempts];
    updated[index] = { ...updated[index], [field]: value };
    setAttempts(updated);
  };

  const handleSave = async () => {
    if (!selectedExerciseId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε άσκηση",
        variant: "destructive"
      });
      return;
    }

    if (attempts.some(a => a.weight_kg <= 0 || a.velocity_ms <= 0)) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('strength_test_sessions')
        .insert({
          user_id: selectedAthleteId,
          test_date: selectedDate,
          start_date: selectedDate,
          end_date: selectedDate,
          notes: 'Load-Velocity Profile'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create attempts
      const attemptsToInsert = attempts.map((attempt, index) => ({
        test_session_id: session.id,
        exercise_id: selectedExerciseId,
        attempt_number: index + 1,
        weight_kg: attempt.weight_kg,
        velocity_ms: attempt.velocity_ms,
        is_1rm: false
      }));

      const { error: attemptsError } = await supabase
        .from('strength_test_attempts')
        .insert(attemptsToInsert);

      if (attemptsError) throw attemptsError;

      toast({
        title: "Επιτυχία",
        description: "Τα δεδομένα αποθηκεύτηκαν"
      });

      // Reset form
      setAttempts([{ weight_kg: 0, velocity_ms: 0 }]);
      fetchHistoricalData();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Προφίλ Φόρτισης/Ταχύτητας</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Άσκηση</Label>
            <ExerciseSelector
              exercises={exercises}
              selectedExerciseId={selectedExerciseId}
              exerciseIndex={0}
              onExerciseSelect={setSelectedExerciseId}
              onRemove={() => setSelectedExerciseId('')}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Προσπάθειες</Label>
              <Button onClick={addAttempt} size="sm" className="rounded-none">
                <Plus className="w-4 h-4 mr-1" />
                Προσπάθεια
              </Button>
            </div>

            {attempts.map((attempt, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-none">
                <span className="text-sm font-medium w-6">#{index + 1}</span>
                
                <div className="flex-1">
                  <Label className="text-xs">Κιλά (kg)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={attempt.weight_kg || ''}
                    onChange={(e) => updateAttempt(index, 'weight_kg', parseFloat(e.target.value) || 0)}
                    className="rounded-none h-8"
                  />
                </div>

                <div className="flex-1">
                  <Label className="text-xs">Ταχύτητα (m/s)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={attempt.velocity_ms || ''}
                    onChange={(e) => updateAttempt(index, 'velocity_ms', parseFloat(e.target.value) || 0)}
                    className="rounded-none h-8"
                  />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeAttempt(index)}
                  className="rounded-none h-8 w-8 p-0 mt-5"
                  disabled={attempts.length === 1}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSave} 
            className="rounded-none w-full"
            disabled={loading}
          >
            {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
        </CardContent>
      </Card>

      {historicalData.length > 0 && selectedExerciseId && (
        <LoadVelocityChart 
          data={historicalData}
          selectedExercises={[exercises.find(e => e.id === selectedExerciseId)?.name || '']}
        />
      )}
    </div>
  );
};
