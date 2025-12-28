import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
import { FunctionalTests } from "@/components/tests/FunctionalTests";

interface CoachFunctionalRecordTabProps {
  coachId: string;
  users: { id: string; name: string; email: string }[];
  onRecordSaved: () => void;
}

interface Form {
  id: string;
  selectedUserId: string;
  fmsScores: Record<string, number>;
  selectedPosture: string[];
  selectedSquatIssues: string[];
  selectedSingleLegIssues: string[];
  musclesNeedStrengthening: string[];
  musclesNeedStretching: string[];
  loading: boolean;
}

export const CoachFunctionalRecordTab: React.FC<CoachFunctionalRecordTabProps> = ({ coachId, users, onRecordSaved }) => {
  const [forms, setForms] = useState<Form[]>([
    { id: '1', selectedUserId: '', fmsScores: {}, selectedPosture: [], selectedSquatIssues: [], selectedSingleLegIssues: [], musclesNeedStrengthening: [], musclesNeedStretching: [], loading: false }
  ]);

  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name, searchTerms: `${u.name} ${u.email}` })), [users]);

  const updateForm = (formId: string, updates: Partial<Form>) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addForm = () => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id)), 0) + 1).toString();
    setForms([...forms, { id: newId, selectedUserId: '', fmsScores: {}, selectedPosture: [], selectedSquatIssues: [], selectedSingleLegIssues: [], musclesNeedStrengthening: [], musclesNeedStretching: [], loading: false }]);
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

    const fmsTotal = Object.values(form.fmsScores).reduce((sum, score) => sum + score, 0);
    const hasData = fmsTotal > 0 || form.selectedPosture.length > 0 || form.selectedSquatIssues.length > 0 || form.selectedSingleLegIssues.length > 0;

    if (!hasData) {
      toast.error("Συμπληρώστε τουλάχιστον ένα πεδίο");
      return;
    }

    updateForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_functional_test_sessions')
        .insert({
          coach_id: coachId,
          coach_user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Λειτουργική Αξιολόγηση'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_functional_test_data')
        .insert({
          test_session_id: session.id,
          fms_score: fmsTotal,
          fms_detailed_scores: form.fmsScores,
          posture_issues: form.selectedPosture,
          squat_issues: form.selectedSquatIssues,
          single_leg_squat_issues: form.selectedSingleLegIssues,
          muscles_need_strengthening: form.musclesNeedStrengthening,
          muscles_need_stretching: form.musclesNeedStretching
        });

      if (dataError) throw dataError;

      toast.success("Αποθηκεύτηκε");
      updateForm(formId, { fmsScores: {}, selectedPosture: [], selectedSquatIssues: [], selectedSingleLegIssues: [], musclesNeedStrengthening: [], musclesNeedStretching: [], loading: false });
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
              <CardTitle className="text-[11px]">Λειτουργικά {forms.length > 1 ? `#${idx + 1}` : ''}</CardTitle>
              <Button onClick={addForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
              {forms.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>}
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-1 space-y-2">
            <div className="flex gap-2 items-end">
              <div className="w-48">
                <Label className="text-[10px]">Αθλητής</Label>
                <Combobox
                  options={userOptions}
                  value={form.selectedUserId}
                  onValueChange={(v) => updateForm(form.id, { selectedUserId: v, musclesNeedStrengthening: [], musclesNeedStretching: [] })}
                  placeholder="Επιλογή"
                  className="h-5 text-[10px]"
                />
              </div>
              <Button onClick={() => handleSave(form.id)} disabled={form.loading} className="rounded-none h-5 px-2 text-[10px]">
                <Save className="w-3 h-3 mr-1" />Αποθήκευση
              </Button>
            </div>

            <FunctionalTests
              selectedAthleteId={form.selectedUserId}
              selectedDate={new Date().toISOString().split('T')[0]}
              hideSubmitButton={true}
              formData={{
                fmsScores: form.fmsScores,
                selectedPosture: form.selectedPosture,
                selectedSquatIssues: form.selectedSquatIssues,
                selectedSingleLegIssues: form.selectedSingleLegIssues
              }}
              onDataChange={(data) => updateForm(form.id, {
                fmsScores: data.fmsScores,
                selectedPosture: data.selectedPosture,
                selectedSquatIssues: data.selectedSquatIssues,
                selectedSingleLegIssues: data.selectedSingleLegIssues
              })}
              onMusclesChange={(muscles) => updateForm(form.id, {
                musclesNeedStrengthening: muscles.strengthen,
                musclesNeedStretching: muscles.stretch
              })}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
