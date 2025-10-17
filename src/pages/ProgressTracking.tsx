import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";

interface Attempt {
  attempt_number: number;
  weight_kg: number;
  velocity_ms: number;
}

export default function ProgressTracking() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [attempts, setAttempts] = useState<Attempt[]>([
    { attempt_number: 1, weight_kg: 0, velocity_ms: 0 }
  ]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchExercises();
  }, []);

  useEffect(() => {
    if (selectedUserId && selectedExerciseId) {
      fetchHistoricalData();
    }
  }, [selectedUserId, selectedExerciseId]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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
        .eq('strength_test_sessions.user_id', selectedUserId)
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
    setAttempts([
      ...attempts,
      { attempt_number: attempts.length + 1, weight_kg: 0, velocity_ms: 0 }
    ]);
  };

  const removeAttempt = (index: number) => {
    if (attempts.length > 1) {
      setAttempts(attempts.filter((_, i) => i !== index));
    }
  };

  const updateAttempt = (index: number, field: keyof Attempt, value: number) => {
    const updated = [...attempts];
    updated[index] = { ...updated[index], [field]: value };
    setAttempts(updated);
  };

  const handleSave = async () => {
    if (!selectedUserId || !selectedExerciseId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη και άσκηση",
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
          user_id: selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          notes: 'Καταγραφή Προόδου - Admin'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create attempts
      const attemptsToInsert = attempts.map((attempt) => ({
        test_session_id: session.id,
        exercise_id: selectedExerciseId,
        attempt_number: attempt.attempt_number,
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
      setAttempts([{ attempt_number: 1, weight_kg: 0, velocity_ms: 0 }]);
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

  const handleVelocityChange = (index: number, value: string) => {
    // Replace period with comma for Greek decimal format
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.')) || 0;
    updateAttempt(index, 'velocity_ms', numericValue);
  };

  const handleWeightChange = (index: number, value: string) => {
    // Replace period with comma for Greek decimal format
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.')) || 0;
    updateAttempt(index, 'weight_kg', numericValue);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Καταγραφή Προόδου</h1>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Νέα Καταγραφή</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Επιλογή Χρήστη</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε χρήστη" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Επιλογή Άσκησης</Label>
              <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                <SelectTrigger className="rounded-none">
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
                <span className="text-sm font-medium w-6">#{attempt.attempt_number}</span>
                
                <div className="flex-1">
                  <Label className="text-xs">Κιλά (kg)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={attempt.weight_kg || ''}
                    onChange={(e) => handleWeightChange(index, e.target.value)}
                    className="rounded-none h-8 no-spinners"
                  />
                </div>

                <div className="flex-1">
                  <Label className="text-xs">Ταχύτητα (m/s)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={attempt.velocity_ms || ''}
                    onChange={(e) => handleVelocityChange(index, e.target.value)}
                    className="rounded-none h-8 no-spinners"
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
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </Button>
        </CardContent>
      </Card>

      {historicalData.length > 0 && selectedExerciseId && (
        <LoadVelocityChart 
          data={historicalData}
          exerciseName={exercises.find(e => e.id === selectedExerciseId)?.name || ''}
        />
      )}
    </div>
  );
}
