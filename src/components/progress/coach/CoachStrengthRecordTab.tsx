import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";

interface Attempt {
  attempt_number: number;
  weight_kg: number;
  velocity_ms: number;
}

interface CoachStrengthRecordTabProps {
  coachId: string;
  users: { id: string; name: string; email: string }[];
  exercises: { id: string; name: string }[];
  onRecordSaved: () => void;
}

interface RecordForm {
  id: string;
  selectedUserId: string;
  selectedExerciseId: string;
  attempts: Attempt[];
  loading: boolean;
}

export const CoachStrengthRecordTab: React.FC<CoachStrengthRecordTabProps> = ({ coachId, users, exercises, onRecordSaved }) => {
  const { toast } = useToast();
  const [forms, setForms] = useState<RecordForm[]>([
    { id: '1', selectedUserId: '', selectedExerciseId: '', attempts: [{ attempt_number: 1, weight_kg: 0, velocity_ms: 0 }], loading: false }
  ]);

  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name, searchTerms: `${u.name} ${u.email}` })), [users]);
  const exerciseOptions = useMemo(() => exercises.map(e => ({ value: e.id, label: e.name })), [exercises]);

  const updateForm = (formId: string, updates: Partial<RecordForm>) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addForm = () => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id)), 0) + 1).toString();
    setForms([...forms, { id: newId, selectedUserId: '', selectedExerciseId: '', attempts: [{ attempt_number: 1, weight_kg: 0, velocity_ms: 0 }], loading: false }]);
  };

  const removeForm = (formId: string) => {
    if (forms.length > 1) setForms(forms.filter(f => f.id !== formId));
  };

  const addAttempt = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    updateForm(formId, { attempts: [...form.attempts, { attempt_number: form.attempts.length + 1, weight_kg: 0, velocity_ms: 0 }] });
  };

  const removeAttempt = (formId: string, index: number) => {
    const form = forms.find(f => f.id === formId);
    if (!form || form.attempts.length <= 1) return;
    const updated = form.attempts.filter((_, i) => i !== index).map((a, i) => ({ ...a, attempt_number: i + 1 }));
    updateForm(formId, { attempts: updated });
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
    if (!form || !form.selectedUserId || !form.selectedExerciseId) {
      toast({ title: "Σφάλμα", description: "Επιλέξτε αθλητή και άσκηση", variant: "destructive" });
      return;
    }

    if (form.attempts.some(a => !a.weight_kg || !a.velocity_ms)) {
      toast({ title: "Σφάλμα", description: "Συμπληρώστε όλα τα πεδία", variant: "destructive" });
      return;
    }

    updateForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_strength_test_sessions')
        .insert({
          coach_id: coachId,
          coach_user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Force/Velocity Test'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const dataToInsert = form.attempts.map((a, i) => ({
        test_session_id: session.id,
        exercise_id: form.selectedExerciseId,
        weight_kg: a.weight_kg,
        velocity_ms: a.velocity_ms,
        is_1rm: i === form.attempts.length - 1
      }));

      const { error: dataError } = await supabase
        .from('coach_strength_test_data')
        .insert(dataToInsert);

      if (dataError) throw dataError;

      toast({ title: "Επιτυχία", description: "Τα δεδομένα αποθηκεύτηκαν" });
      updateForm(formId, { attempts: [{ attempt_number: 1, weight_kg: 0, velocity_ms: 0 }], loading: false });
      onRecordSaved();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία αποθήκευσης", variant: "destructive" });
      updateForm(formId, { loading: false });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={addForm} size="sm" className="rounded-none"><Plus className="w-4 h-4 mr-1" />Νέα Καταγραφή</Button>
      </div>

      {forms.map((form, formIndex) => (
        <Card key={form.id} className="rounded-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <CardTitle className="text-base">Καταγραφή #{formIndex + 1}</CardTitle>
              <div className="flex gap-3">
                <div className="w-64">
                  <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateForm(form.id, { selectedUserId: v })} placeholder="Επιλέξτε αθλητή" />
                </div>
                <div className="w-64">
                  <Combobox options={exerciseOptions} value={form.selectedExerciseId} onValueChange={(v) => updateForm(form.id, { selectedExerciseId: v })} placeholder="Επιλέξτε άσκηση" />
                </div>
              </div>
              {forms.length > 1 && (
                <Button size="sm" variant="destructive" onClick={() => removeForm(form.id)} className="rounded-none ml-auto"><Trash2 className="w-4 h-4" /></Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Προσπάθειες</Label>
                  <Button onClick={() => addAttempt(form.id)} size="sm" className="rounded-none h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Προσπάθεια</Button>
                </div>
                <div className="space-y-1">
                  {form.attempts.map((attempt, index) => (
                    <div key={index} className="flex items-center gap-1 p-1 border rounded-none bg-background">
                      <span className="text-xs font-medium w-4">#{attempt.attempt_number}</span>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        value={attempt.weight_kg || ''}
                        onChange={(e) => updateAttempt(form.id, index, 'weight_kg', parseFloat(e.target.value) || 0)}
                        className="rounded-none h-6 text-xs w-16 no-spinners"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="m/s"
                        value={attempt.velocity_ms || ''}
                        onChange={(e) => updateAttempt(form.id, index, 'velocity_ms', parseFloat(e.target.value) || 0)}
                        className="rounded-none h-6 text-xs w-16 no-spinners"
                      />
                      <Button size="sm" variant="outline" onClick={() => removeAttempt(form.id, index)} className="rounded-none h-6 w-6 p-0" disabled={form.attempts.length === 1}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => handleSave(form.id)} className="rounded-none w-full h-8 text-sm" disabled={form.loading}>
                <Save className="w-3 h-3 mr-2" />{form.loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
