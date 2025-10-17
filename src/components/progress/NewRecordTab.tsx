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

interface RecordForm {
  id: string;
  selectedUserId: string;
  selectedExerciseId: string;
  attempts: Attempt[];
  historicalData: any[];
  loading: boolean;
}

export const NewRecordTab: React.FC<NewRecordTabProps> = ({ users, exercises, onRecordSaved }) => {
  const { toast } = useToast();
  const [forms, setForms] = useState<RecordForm[]>([
    {
      id: '1',
      selectedUserId: '',
      selectedExerciseId: '',
      attempts: [{ attempt_number: 1, weight_kg: undefined as any, velocity_ms: undefined as any }],
      historicalData: [],
      loading: false
    }
  ]);

  const userOptions = useMemo(() => 
    (users || []).map(user => ({ value: user.id, label: user.name })),
    [users]
  );

  const exerciseOptions = useMemo(() => 
    (exercises || []).map(exercise => ({ value: exercise.id, label: exercise.name })),
    [exercises]
  );

  const addNewForm = () => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id))) + 1).toString();
    setForms([...forms, {
      id: newId,
      selectedUserId: '',
      selectedExerciseId: '',
      attempts: [{ attempt_number: 1, weight_kg: undefined as any, velocity_ms: undefined as any }],
      historicalData: [],
      loading: false
    }]);
  };

  const removeForm = (formId: string) => {
    if (forms.length > 1) {
      setForms(forms.filter(f => f.id !== formId));
    }
  };

  const updateForm = (formId: string, updates: Partial<RecordForm>) => {
    setForms(forms.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const fetchHistoricalData = async (formId: string, userId: string, exerciseId: string) => {
    if (!userId || !exerciseId) return;

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
        .eq('exercise_id', exerciseId)
        .eq('strength_test_sessions.user_id', userId)
        .not('velocity_ms', 'is', null)
        .order('weight_kg', { ascending: false });

      if (error) throw error;

      const chartData = (data || []).map(attempt => ({
        exerciseName: exercises.find(e => e.id === exerciseId)?.name || '',
        velocity: attempt.velocity_ms || 0,
        weight: attempt.weight_kg,
        date: attempt.strength_test_sessions.test_date
      }));

      updateForm(formId, { historicalData: chartData });
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const addAttempt = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    updateForm(formId, {
      attempts: [
        ...form.attempts,
        { attempt_number: form.attempts.length + 1, weight_kg: undefined as any, velocity_ms: undefined as any }
      ]
    });
  };

  const removeAttempt = (formId: string, index: number) => {
    const form = forms.find(f => f.id === formId);
    if (!form || form.attempts.length <= 1) return;

    updateForm(formId, {
      attempts: form.attempts.filter((_, i) => i !== index)
    });
  };

  const updateAttempt = (formId: string, index: number, field: keyof Attempt, value: number) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const updated = [...form.attempts];
    updated[index] = { ...updated[index], [field]: value };
    updateForm(formId, { attempts: updated });
  };

  const handleSave = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    if (!form.selectedUserId || !form.selectedExerciseId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη και άσκηση",
        variant: "destructive"
      });
      return;
    }

    if (form.attempts.some(a => 
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

    updateForm(formId, { loading: true });
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Δεν βρέθηκε συνδεδεμένος χρήστης');
      }

      const { data: session, error: sessionError } = await supabase
        .from('strength_test_sessions')
        .insert({
          user_id: form.selectedUserId,
          created_by: user.id,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Καταγραφή Προόδου - Admin'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const attemptsToInsert = form.attempts.map((attempt) => ({
        test_session_id: session.id,
        exercise_id: form.selectedExerciseId,
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

      updateForm(formId, {
        attempts: [{ attempt_number: 1, weight_kg: undefined as any, velocity_ms: undefined as any }],
        loading: false
      });
      fetchHistoricalData(formId, form.selectedUserId, form.selectedExerciseId);
      onRecordSaved();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
    } finally {
      updateForm(formId, { loading: false });
    }
  };

  const handleVelocityChange = (formId: string, index: number, value: string) => {
    if (value === '') {
      updateAttempt(formId, index, 'velocity_ms', undefined as any);
      return;
    }
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      updateAttempt(formId, index, 'velocity_ms', numericValue);
    }
  };

  const handleWeightChange = (formId: string, index: number, value: string) => {
    if (value === '') {
      updateAttempt(formId, index, 'weight_kg', undefined as any);
      return;
    }
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      updateAttempt(formId, index, 'weight_kg', numericValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={addNewForm} size="sm" className="rounded-none">
          <Plus className="w-4 h-4 mr-1" />
          Νέα Καταγραφή
        </Button>
      </div>

      {forms.map((form, formIndex) => {
        const chartData = useMemo(() => {
          const currentAttempts = form.attempts
            .filter(a => a.weight_kg && a.velocity_ms && a.weight_kg > 0 && a.velocity_ms > 0)
            .map(a => ({
              exerciseName: exercises.find(e => e.id === form.selectedExerciseId)?.name || '',
              velocity: a.velocity_ms,
              weight: a.weight_kg,
              date: new Date().toISOString().split('T')[0]
            }));

          return [...form.historicalData, ...currentAttempts];
        }, [form.historicalData, form.attempts, form.selectedExerciseId]);

        return (
          <Card key={form.id} className="rounded-none">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <CardTitle className="whitespace-nowrap text-base">Καταγραφή #{formIndex + 1}</CardTitle>
                <div className="flex gap-3">
                  <div className="w-48">
                    <Combobox
                      options={userOptions}
                      value={form.selectedUserId}
                      onValueChange={(val) => {
                        updateForm(form.id, { selectedUserId: val });
                        if (val && form.selectedExerciseId) fetchHistoricalData(form.id, val, form.selectedExerciseId);
                      }}
                      placeholder="Επιλέξτε χρήστη"
                      emptyMessage="Δεν βρέθηκε χρήστης."
                    />
                  </div>

                  <div className="w-48">
                    <Combobox
                      options={exerciseOptions}
                      value={form.selectedExerciseId}
                      onValueChange={(val) => {
                        updateForm(form.id, { selectedExerciseId: val });
                        if (val && form.selectedUserId) fetchHistoricalData(form.id, form.selectedUserId, val);
                      }}
                      placeholder="Επιλέξτε άσκηση"
                      emptyMessage="Δεν βρέθηκε άσκηση."
                    />
                  </div>
                </div>
                {forms.length > 1 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeForm(form.id)}
                    className="rounded-none ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left side - Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Προσπάθειες</Label>
                      <Button onClick={() => addAttempt(form.id)} size="sm" className="rounded-none h-7 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Προσπάθεια
                      </Button>
                    </div>

                    <div className="space-y-1">
                      {form.attempts.map((attempt, index) => (
                        <div key={index} className="flex items-center gap-1 p-1 border rounded-none bg-white">
                          <span className="text-xs font-medium w-4">#{attempt.attempt_number}</span>
                          
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="kg"
                            value={attempt.weight_kg ?? ''}
                            onChange={(e) => handleWeightChange(form.id, index, e.target.value)}
                            className="rounded-none h-6 text-xs w-16 px-1 no-spinners"
                          />

                          <Input
                            type="number"
                            step="0.01"
                            placeholder="m/s"
                            value={attempt.velocity_ms ?? ''}
                            onChange={(e) => handleVelocityChange(form.id, index, e.target.value)}
                            className="rounded-none h-6 text-xs w-16 px-1 no-spinners"
                          />

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAttempt(form.id, index)}
                            className="rounded-none h-6 w-6 p-0"
                            disabled={form.attempts.length === 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleSave(form.id)} 
                    className="rounded-none w-full h-8 text-sm"
                    disabled={form.loading}
                  >
                    <Save className="w-3 h-3 mr-2" />
                    {form.loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
                  </Button>
                </div>

                {/* Right side - Chart */}
                <div className="flex items-center justify-center">
                  {form.selectedExerciseId && form.selectedUserId ? (
                    <div className="w-full">
                      <LoadVelocityChart 
                        data={chartData}
                        exerciseName={exercises.find(e => e.id === form.selectedExerciseId)?.name || ''}
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
        );
      })}
    </div>
  );
};
