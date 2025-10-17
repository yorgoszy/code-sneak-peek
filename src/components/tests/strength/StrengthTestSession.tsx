import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";

interface Exercise {
  id: string;
  name: string;
}

interface Attempt {
  attempt_number: number;
  weight_kg: number;
  velocity_ms?: number;
  is_1rm: boolean;
}

interface StrengthTestSessionProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const StrengthTestSession = ({ selectedAthleteId, selectedDate }: StrengthTestSessionProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (selectedExerciseId && selectedAthleteId) {
      fetchChartData();
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
      toast({
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των ασκήσεων",
        variant: "destructive"
      });
    }
  };

  const fetchChartData = async () => {
    try {
      const { data, error } = await supabase
        .from('strength_test_attempts')
        .select(`
          weight_kg,
          velocity_ms,
          test_session_id,
          strength_test_sessions!inner(test_date, user_id)
        `)
        .eq('exercise_id', selectedExerciseId)
        .eq('strength_test_sessions.user_id', selectedAthleteId)
        .not('velocity_ms', 'is', null);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        exerciseName: exercises.find(ex => ex.id === selectedExerciseId)?.name || '',
        velocity: item.velocity_ms || 0,
        weight: item.weight_kg,
        date: item.strength_test_sessions.test_date
      })) || [];

      setChartData(formattedData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const addAttempt = () => {
    const newAttempt: Attempt = {
      attempt_number: attempts.length + 1,
      weight_kg: 0,
      velocity_ms: 0,
      is_1rm: false
    };
    setAttempts([...attempts, newAttempt]);
  };

  const updateAttempt = (index: number, field: keyof Attempt, value: any) => {
    const updatedAttempts = [...attempts];
    updatedAttempts[index] = {
      ...updatedAttempts[index],
      [field]: value
    };
    setAttempts(updatedAttempts);
  };

  const removeAttempt = (index: number) => {
    setAttempts(attempts.filter((_, i) => i !== index));
  };

  const markAs1RM = (index: number) => {
    const updatedAttempts = attempts.map((attempt, i) => ({
      ...attempt,
      is_1rm: i === index ? !attempt.is_1rm : false
    }));
    setAttempts(updatedAttempts);
  };

  const saveTest = async () => {
    if (!selectedExerciseId || !selectedAthleteId || attempts.length === 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε άσκηση και προσθέστε τουλάχιστον μία προσπάθεια",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Δημιουργία session
      const { data: session, error: sessionError } = await supabase
        .from('strength_test_sessions')
        .insert({
          user_id: selectedAthleteId,
          test_date: selectedDate,
          notes: notes
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Αποθήκευση attempts
      const attemptsToSave = attempts.map(attempt => ({
        test_session_id: session.id,
        exercise_id: selectedExerciseId,
        attempt_number: attempt.attempt_number,
        weight_kg: attempt.weight_kg,
        velocity_ms: attempt.velocity_ms,
        is_1rm: attempt.is_1rm
      }));

      const { error: attemptsError } = await supabase
        .from('strength_test_attempts')
        .insert(attemptsToSave);

      if (attemptsError) throw attemptsError;

      toast({
        title: "Επιτυχία",
        description: "Το τεστ δύναμης αποθηκεύτηκε επιτυχώς"
      });

      // Reset form
      setAttempts([]);
      setNotes('');
      fetchChartData();

    } catch (error) {
      console.error('Error saving test:', error);
      toast({
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποθήκευση του τεστ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);

  return (
    <div className="space-y-6">
      {/* Φόρμα Τεστ */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Τεστ Δύναμης</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Επιλογή Άσκησης */}
          <div>
            <Label>Άσκηση</Label>
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Επιλέξτε άσκηση" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map(exercise => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Προσπάθειες */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Προσπάθειες</Label>
              <Button 
                onClick={addAttempt}
                size="sm"
                className="rounded-none"
              >
                <Plus className="w-4 h-4 mr-1" />
                Προσπάθεια
              </Button>
            </div>

            <div className="space-y-2">
              {attempts.map((attempt, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-none">
                  <span className="text-sm font-medium w-8">#{attempt.attempt_number}</span>
                  
                  <div className="flex-1">
                    <Label className="text-xs">Κιλά</Label>
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
                    variant={attempt.is_1rm ? "default" : "outline"}
                    onClick={() => markAs1RM(index)}
                    className="rounded-none"
                  >
                    1RM
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeAttempt(index)}
                    className="rounded-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Σημειώσεις */}
          <div>
            <Label>Σημειώσεις</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-none"
              placeholder="Προσθέστε σημειώσεις για το τεστ..."
            />
          </div>

          {/* Κουμπί Αποθήκευσης */}
          <Button 
            onClick={saveTest}
            disabled={loading || !selectedExerciseId || attempts.length === 0}
            className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Αποθήκευση...' : 'Αποθήκευση Τεστ'}
          </Button>
        </CardContent>
      </Card>

      {/* Γράφημα Load-Velocity */}
      {selectedExercise && chartData.length > 0 && (
        <LoadVelocityChart 
          data={chartData}
          selectedExercises={[selectedExercise.name]}
        />
      )}
    </div>
  );
};