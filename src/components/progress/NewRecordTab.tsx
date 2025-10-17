import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";

interface Attempt {
  attempt_number: number;
  weight_kg: number;
  velocity_ms: number;
}

interface NewRecordTabProps {
  users: any[];
  exercises: any[];
  onRecordSaved: () => void;
}

export const NewRecordTab: React.FC<NewRecordTabProps> = ({ users, exercises, onRecordSaved }) => {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [attempts, setAttempts] = useState<Attempt[]>([
    { attempt_number: 1, weight_kg: undefined as any, velocity_ms: undefined as any }
  ]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const userOptions = useMemo(() => 
    (users || []).map(user => ({ value: user.id, label: user.name })),
    [users]
  );

  const exerciseOptions = useMemo(() => 
    (exercises || []).map(exercise => ({ value: exercise.id, label: exercise.name })),
    [exercises]
  );

  const fetchHistoricalData = async () => {
    if (!selectedUserId || !selectedExerciseId) return;
    
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
      { attempt_number: attempts.length + 1, weight_kg: undefined as any, velocity_ms: undefined as any }
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

    if (attempts.some(a => 
      !a.weight_kg || !a.velocity_ms ||
      a.weight_kg <= 0 || a.velocity_ms <= 0
    )) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Δεν βρέθηκε συνδεδεμένος χρήστης');
      }

      const { data: session, error: sessionError } = await supabase
        .from('strength_test_sessions')
        .insert({
          user_id: selectedUserId,
          created_by: user.id,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Καταγραφή Προόδου - Admin'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

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

      setAttempts([{ attempt_number: 1, weight_kg: undefined as any, velocity_ms: undefined as any }]);
      fetchHistoricalData();
      onRecordSaved();
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
    if (value === '') {
      updateAttempt(index, 'velocity_ms', undefined as any);
      return;
    }
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      updateAttempt(index, 'velocity_ms', numericValue);
    }
  };

  const handleWeightChange = (index: number, value: string) => {
    if (value === '') {
      updateAttempt(index, 'weight_kg', undefined as any);
      return;
    }
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      updateAttempt(index, 'weight_kg', numericValue);
    }
  };

  // Combine historical data with current attempts for real-time chart update
  const chartData = useMemo(() => {
    const currentAttempts = attempts
      .filter(a => a.weight_kg && a.velocity_ms && a.weight_kg > 0 && a.velocity_ms > 0)
      .map(a => ({
        exerciseName: exercises.find(e => e.id === selectedExerciseId)?.name || '',
        velocity: a.velocity_ms,
        weight: a.weight_kg,
        date: new Date().toISOString().split('T')[0]
      }));

    return [...historicalData, ...currentAttempts];
  }, [historicalData, attempts, selectedExerciseId, exercises]);

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <CardTitle className="whitespace-nowrap text-base">Νέα Καταγραφή</CardTitle>
            <div className="flex gap-3">
              <div className="w-48">
                <Combobox
                  options={userOptions}
                  value={selectedUserId}
                  onValueChange={(val) => {
                    setSelectedUserId(val);
                    if (val && selectedExerciseId) fetchHistoricalData();
                  }}
                  placeholder="Επιλέξτε χρήστη"
                  emptyMessage="Δεν βρέθηκε χρήστης."
                />
              </div>

              <div className="w-48">
                <Combobox
                  options={exerciseOptions}
                  value={selectedExerciseId}
                  onValueChange={(val) => {
                    setSelectedExerciseId(val);
                    if (val && selectedUserId) fetchHistoricalData();
                  }}
                  placeholder="Επιλέξτε άσκηση"
                  emptyMessage="Δεν βρέθηκε άσκηση."
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Προσπάθειες</Label>
                  <Button onClick={addAttempt} size="sm" className="rounded-none h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Προσπάθεια
                  </Button>
                </div>

                <div className="space-y-1">
                  {attempts.map((attempt, index) => (
                    <div key={index} className="flex items-center gap-1 p-1 border rounded-none bg-white">
                      <span className="text-xs font-medium w-4">#{attempt.attempt_number}</span>
                      
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        value={attempt.weight_kg ?? ''}
                        onChange={(e) => handleWeightChange(index, e.target.value)}
                        className="rounded-none h-6 text-xs w-16 px-1 no-spinners"
                      />

                      <Input
                        type="number"
                        step="0.01"
                        placeholder="m/s"
                        value={attempt.velocity_ms ?? ''}
                        onChange={(e) => handleVelocityChange(index, e.target.value)}
                        className="rounded-none h-6 text-xs w-16 px-1 no-spinners"
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeAttempt(index)}
                        className="rounded-none h-6 w-6 p-0"
                        disabled={attempts.length === 1}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                className="rounded-none w-full h-8 text-sm"
                disabled={loading}
              >
                <Save className="w-3 h-3 mr-2" />
                {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </Button>
            </div>

            {/* Right side - Chart */}
            <div className="flex items-center justify-center">
              {selectedExerciseId && selectedUserId ? (
                <div className="w-full">
                  <LoadVelocityChart 
                    data={chartData}
                    exerciseName={exercises.find(e => e.id === selectedExerciseId)?.name || ''}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-400 text-sm">
                  Επιλέξτε χρήστη και άσκηση για να δείτε το γράφημα
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
