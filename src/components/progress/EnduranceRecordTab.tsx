import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";

interface MasForm {
  id: string;
  selectedUserId: string;
  selectedExerciseId: string;
  distance: string;
  duration: string;
  loading: boolean;
}

interface EnduranceRecordTabProps {
  users: any[];
  exercises: any[];
  onRecordSaved?: () => void;
}

export const EnduranceRecordTab: React.FC<EnduranceRecordTabProps> = ({ 
  users, 
  exercises,
  onRecordSaved 
}) => {
  const { toast } = useToast();
  const [forms, setForms] = useState<MasForm[]>([
    {
      id: '1',
      selectedUserId: '',
      selectedExerciseId: '',
      distance: '',
      duration: '',
      loading: false
    }
  ]);

  const userOptions = useMemo(() => 
    (users || []).map(user => ({ 
      value: user.id, 
      label: user.name,
      searchTerms: `${user.name} ${user.email || ''}`
    })),
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
      distance: '',
      duration: '',
      loading: false
    }]);
  };

  const removeForm = (formId: string) => {
    if (forms.length > 1) {
      setForms(forms.filter(f => f.id !== formId));
    }
  };

  const updateForm = (formId: string, updates: Partial<MasForm>) => {
    setForms(prevForms => prevForms.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  // Calculate MAS for a specific form
  const calculateMas = (distance: string, duration: string) => {
    const dist = parseFloat(distance);
    const dur = parseFloat(duration);
    
    if (!dist || !dur || dist <= 0 || dur <= 0) {
      return '';
    }
    
    const mas = dist / (dur * 60);
    return mas.toFixed(2);
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

    const dist = parseFloat(form.distance);
    const dur = parseFloat(form.duration);

    if (!dist || !dur || dist <= 0 || dur <= 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε απόσταση και διάρκεια",
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

      // Create test session
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'MAS Test - Καταγραφή Προόδου'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Calculate MAS values
      const mas = dist / (dur * 60);
      const masKmh = mas * 3.6;

      // Save endurance test data
      const { error: dataError } = await supabase
        .from('endurance_test_data')
        .insert({
          test_session_id: session.id,
          mas_meters: dist,
          mas_minutes: dur,
          mas_ms: mas,
          mas_kmh: masKmh
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Το MAS Test αποθηκεύτηκε"
      });

      // Reset form
      updateForm(formId, {
        distance: '',
        duration: '',
        loading: false
      });
      
      if (onRecordSaved) {
        onRecordSaved();
      }
    } catch (error) {
      console.error('Error saving MAS test:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
      updateForm(formId, { loading: false });
    }
  };

  const handleDistanceChange = (formId: string, value: string) => {
    if (value === '') {
      updateForm(formId, { distance: '' });
      return;
    }
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      updateForm(formId, { distance: numericValue.toString() });
    }
  };

  const handleDurationChange = (formId: string, value: string) => {
    if (value === '') {
      updateForm(formId, { duration: '' });
      return;
    }
    const normalizedValue = value.replace('.', ',');
    const numericValue = parseFloat(normalizedValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      updateForm(formId, { duration: numericValue.toString() });
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={addNewForm} size="sm" className="rounded-none h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Νέα Καταγραφή
        </Button>
      </div>

      {forms.map((form, formIndex) => {
        const calculatedMas = calculateMas(form.distance, form.duration);

        return (
          <Card key={form.id} className="rounded-none w-fit">
            <CardHeader className="pb-1 pt-2 px-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs">MAS Test #{formIndex + 1}</CardTitle>
                {forms.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeForm(form.id)}
                    className="rounded-none h-5 w-5 p-0 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
              {/* User and Exercise Selection */}
              <div className="flex gap-2">
                <div className="w-40">
                  <Label className="text-xs">Ασκούμενος</Label>
                  <Combobox
                    options={userOptions}
                    value={form.selectedUserId}
                    onValueChange={(val) => updateForm(form.id, { selectedUserId: val })}
                    placeholder="Χρήστης"
                    emptyMessage="Δεν βρέθηκε."
                    className="h-7 text-xs"
                  />
                </div>

                <div className="w-40">
                  <Label className="text-xs">Άσκηση</Label>
                  <Combobox
                    options={exerciseOptions}
                    value={form.selectedExerciseId}
                    onValueChange={(val) => updateForm(form.id, { selectedExerciseId: val })}
                    placeholder="Άσκηση"
                    emptyMessage="Δεν βρέθηκε."
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Distance, Duration, and MAS */}
              <div className="flex gap-2">
                <div className="w-24">
                  <Label className="text-xs">Μέτρα</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="m"
                    value={form.distance}
                    onChange={(e) => handleDistanceChange(form.id, e.target.value)}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="w-24">
                  <Label className="text-xs">Λεπτά</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="λεπτά"
                    value={form.duration}
                    onChange={(e) => handleDurationChange(form.id, e.target.value)}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="w-20">
                  <Label className="text-xs">MAS</Label>
                  <Input
                    type="text"
                    value={calculatedMas}
                    readOnly
                    placeholder="m/s"
                    className="rounded-none bg-gray-100 h-7 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => handleSave(form.id)} 
                    className="rounded-none h-7 text-xs px-3"
                    disabled={form.loading}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {form.loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};