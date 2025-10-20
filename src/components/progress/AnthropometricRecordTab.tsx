import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";

interface AnthropometricRecordTabProps {
  users: any[];
  onRecordSaved: () => void;
}

interface AnthropometricForm {
  id: string;
  selectedUserId: string;
  height: string;
  weight: string;
  muscleMassPercentage: string;
  boneDensity: string;
  bodyFatPercentage: string;
  visceralFatPercentage: string;
  loading: boolean;
}

export const AnthropometricRecordTab = ({ users, onRecordSaved }: AnthropometricRecordTabProps) => {
  const [forms, setForms] = useState<AnthropometricForm[]>([
    {
      id: '1',
      selectedUserId: '',
      height: '',
      weight: '',
      muscleMassPercentage: '',
      boneDensity: '',
      bodyFatPercentage: '',
      visceralFatPercentage: '',
      loading: false
    }
  ]);

  const userOptions = users.map(user => ({
    value: user.id,
    label: user.name,
    searchTerms: `${user.name} ${user.email || ''}`
  }));

  const updateForm = (formId: string, updates: Partial<AnthropometricForm>) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addNewForm = () => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id))) + 1).toString();
    setForms(prev => [...prev, {
      id: newId,
      selectedUserId: '',
      height: '',
      weight: '',
      muscleMassPercentage: '',
      boneDensity: '',
      bodyFatPercentage: '',
      visceralFatPercentage: '',
      loading: false
    }]);
  };

  const removeForm = (formId: string) => {
    setForms(prev => prev.filter(f => f.id !== formId));
  };

  const handleSave = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    if (!form.selectedUserId) {
      toast.error("Παρακαλώ επιλέξτε ασκούμενο");
      return;
    }

    // Validate at least one field is filled
    if (!form.height && !form.weight && !form.muscleMassPercentage && !form.boneDensity && !form.bodyFatPercentage && !form.visceralFatPercentage) {
      toast.error("Παρακαλώ συμπληρώστε τουλάχιστον ένα πεδίο");
      return;
    }

    updateForm(formId, { loading: true });

    try {
      // Create test session
      const { data: session, error: sessionError } = await supabase
        .from('anthropometric_test_sessions')
        .insert({
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Σωματομετρική Καταγραφή'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create anthropometric data
      const dataToInsert: Record<string, any> = {
        test_session_id: session.id
      };

      if (form.height) dataToInsert.height = parseFloat(form.height);
      if (form.weight) dataToInsert.weight = parseFloat(form.weight);
      if (form.muscleMassPercentage) dataToInsert.muscle_mass_percentage = parseFloat(form.muscleMassPercentage);
      if (form.boneDensity) dataToInsert.bone_density = parseFloat(form.boneDensity);
      if (form.bodyFatPercentage) dataToInsert.body_fat_percentage = parseFloat(form.bodyFatPercentage);
      if (form.visceralFatPercentage) dataToInsert.visceral_fat_percentage = parseFloat(form.visceralFatPercentage);

      const { error: dataError } = await supabase
        .from('anthropometric_test_data')
        .insert(dataToInsert);

      if (dataError) throw dataError;

      toast.success("Η καταγραφή αποθηκεύτηκε");

      // Reset form
      updateForm(formId, {
        selectedUserId: '',
        height: '',
        weight: '',
        muscleMassPercentage: '',
        boneDensity: '',
        bodyFatPercentage: '',
        visceralFatPercentage: '',
        loading: false
      });

      onRecordSaved();
    } catch (error) {
      console.error('Error saving anthropometric data:', error);
      toast.error("Αποτυχία αποθήκευσης");
      updateForm(formId, { loading: false });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-[1px] overflow-x-auto pb-2">
        <div className="space-y-2">
          {forms.map((form, formIndex) => (
            <Card key={form.id} className="rounded-none w-[calc(66.666%+120px)]">
              <CardHeader className="pb-0.5 pt-1.5 px-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-[11px]">
                    Σωματομετρικά {forms.length > 1 ? `#${formIndex + 1}` : ''}
                  </CardTitle>
                  <Button 
                    onClick={addNewForm} 
                    size="sm" 
                    className="rounded-none h-4 w-4 p-0 ml-auto bg-black hover:bg-black/90 text-white"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </Button>
                  {forms.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeForm(form.id)}
                      className="rounded-none h-4 w-4 p-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-1 space-y-1.5">
                {/* User Selection */}
                <div className="flex gap-1.5">
                  <div className="w-36">
                    <Label className="text-[11px]">Ασκούμενος</Label>
                    <Combobox
                      options={userOptions}
                      value={form.selectedUserId}
                      onValueChange={(val) => updateForm(form.id, { selectedUserId: val })}
                      placeholder="Χρήστης"
                      emptyMessage="Δεν βρέθηκε."
                      className="h-6 text-[11px]"
                    />
                  </div>
                </div>

                {/* Measurements */}
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <Label className="text-[11px]">Ύψος (cm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={form.height}
                      onChange={(e) => updateForm(form.id, { height: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[11px]"
                    />
                  </div>

                  <div className="flex-1">
                    <Label className="text-[11px]">Βάρος (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="kg"
                      value={form.weight}
                      onChange={(e) => updateForm(form.id, { weight: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[11px]"
                    />
                  </div>

                  <div className="flex-1">
                    <Label className="text-[11px]">Μυϊκή Μάζα (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="%"
                      value={form.muscleMassPercentage}
                      onChange={(e) => updateForm(form.id, { muscleMassPercentage: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[11px]"
                    />
                  </div>

                  <div className="flex-1">
                    <Label className="text-[11px]">Οστική Πυκνότητα (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="kg"
                      value={form.boneDensity}
                      onChange={(e) => updateForm(form.id, { boneDensity: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[11px]"
                    />
                  </div>

                  <div className="flex-1">
                    <Label className="text-[11px]">Λίπους (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="%"
                      value={form.bodyFatPercentage}
                      onChange={(e) => updateForm(form.id, { bodyFatPercentage: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[11px]"
                    />
                  </div>

                  <div className="flex-1">
                    <Label className="text-[11px]">Σπλαχνικό Λίπος (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="%"
                      value={form.visceralFatPercentage}
                      onChange={(e) => updateForm(form.id, { visceralFatPercentage: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[11px]"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => handleSave(form.id)}
                      disabled={form.loading}
                      className="rounded-none h-6 w-6 p-0 bg-black hover:bg-black/90 text-white"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
