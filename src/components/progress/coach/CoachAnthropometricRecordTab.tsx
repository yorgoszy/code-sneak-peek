import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";

interface CoachAnthropometricRecordTabProps {
  coachId: string;
  users: { id: string; name: string; email: string }[];
  onRecordSaved: () => void;
}

interface Form {
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

export const CoachAnthropometricRecordTab: React.FC<CoachAnthropometricRecordTabProps> = ({ coachId, users, onRecordSaved }) => {
  const [forms, setForms] = useState<Form[]>([
    { id: '1', selectedUserId: '', height: '', weight: '', muscleMassPercentage: '', boneDensity: '', bodyFatPercentage: '', visceralFatPercentage: '', loading: false }
  ]);

  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name, searchTerms: `${u.name} ${u.email}` })), [users]);

  const updateForm = (formId: string, updates: Partial<Form>) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addForm = () => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id)), 0) + 1).toString();
    setForms([...forms, { id: newId, selectedUserId: '', height: '', weight: '', muscleMassPercentage: '', boneDensity: '', bodyFatPercentage: '', visceralFatPercentage: '', loading: false }]);
  };

  const removeForm = (formId: string) => {
    if (forms.length > 1) setForms(forms.filter(f => f.id !== formId));
  };

  const handleSave = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form || !form.selectedUserId) {
      toast.error("Επιλέξτε αθλητή");
      return;
    }

    if (!form.height && !form.weight && !form.muscleMassPercentage && !form.boneDensity && !form.bodyFatPercentage && !form.visceralFatPercentage) {
      toast.error("Συμπληρώστε τουλάχιστον ένα πεδίο");
      return;
    }

    updateForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_anthropometric_test_sessions')
        .insert({
          coach_id: coachId,
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Σωματομετρική Καταγραφή'
        } as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const dataToInsert = {
        test_session_id: session.id,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        muscle_mass_percentage: form.muscleMassPercentage ? parseFloat(form.muscleMassPercentage) : null,
        bone_density: form.boneDensity ? parseFloat(form.boneDensity) : null,
        body_fat_percentage: form.bodyFatPercentage ? parseFloat(form.bodyFatPercentage) : null,
        visceral_fat_percentage: form.visceralFatPercentage ? parseFloat(form.visceralFatPercentage) : null
      };

      const { error: dataError } = await supabase
        .from('coach_anthropometric_test_data')
        .insert([dataToInsert]);

      if (dataError) throw dataError;

      toast.success("Αποθηκεύτηκε");
      updateForm(formId, { height: '', weight: '', muscleMassPercentage: '', boneDensity: '', bodyFatPercentage: '', visceralFatPercentage: '', loading: false });
      onRecordSaved();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Αποτυχία αποθήκευσης");
      updateForm(formId, { loading: false });
    }
  };

  return (
    <div className="space-y-2">
      {forms.map((form, idx) => (
        <Card key={form.id} className="rounded-none">
          <CardHeader className="pb-0.5 pt-1.5 px-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[11px]">Σωματομετρικά {forms.length > 1 ? `#${idx + 1}` : ''}</CardTitle>
              <Button onClick={addForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
              {forms.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>}
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-1 space-y-1.5">
            <div className="flex gap-1.5">
              <div className="w-36">
                <Label className="text-[10px]">Αθλητής</Label>
                <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateForm(form.id, { selectedUserId: v })} placeholder="Επιλογή" className="h-5 text-[10px]" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="flex-1">
                <Label className="text-[10px]">Ύψος (cm)</Label>
                <Input type="number" value={form.height} onChange={(e) => updateForm(form.id, { height: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
              </div>
              <div className="flex-1">
                <Label className="text-[10px]">Βάρος (kg)</Label>
                <Input type="number" value={form.weight} onChange={(e) => updateForm(form.id, { weight: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
              </div>
              <div className="flex-1">
                <Label className="text-[10px]">Μυϊκή Μάζα (%)</Label>
                <Input type="number" value={form.muscleMassPercentage} onChange={(e) => updateForm(form.id, { muscleMassPercentage: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
              </div>
              <div className="flex-1">
                <Label className="text-[10px]">Οστική (kg)</Label>
                <Input type="number" value={form.boneDensity} onChange={(e) => updateForm(form.id, { boneDensity: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
              </div>
              <div className="flex-1">
                <Label className="text-[10px]">Λίπος (%)</Label>
                <Input type="number" value={form.bodyFatPercentage} onChange={(e) => updateForm(form.id, { bodyFatPercentage: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
              </div>
              <div className="flex-1">
                <Label className="text-[10px]">Σπλαχνικό (%)</Label>
                <Input type="number" value={form.visceralFatPercentage} onChange={(e) => updateForm(form.id, { visceralFatPercentage: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
              </div>
              <div className="flex items-end">
                <Button onClick={() => handleSave(form.id)} disabled={form.loading} className="rounded-none h-5 w-5 p-0"><Save className="w-3 h-3" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
