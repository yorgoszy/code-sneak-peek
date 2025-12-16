import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
import { FunctionalTests } from "@/components/tests/FunctionalTests";

interface FunctionalRecordTabProps {
  users: any[];
  onRecordSaved: () => void;
}

interface FunctionalForm {
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

export const FunctionalRecordTab = ({ users, onRecordSaved }: FunctionalRecordTabProps) => {
  const [forms, setForms] = useState<FunctionalForm[]>([
    {
      id: '1',
      selectedUserId: '',
      fmsScores: {},
      selectedPosture: [],
      selectedSquatIssues: [],
      selectedSingleLegIssues: [],
      musclesNeedStrengthening: [],
      musclesNeedStretching: [],
      loading: false
    }
  ]);

  const userOptions = users.map(user => ({
    value: user.id,
    label: user.name,
    searchTerms: `${user.name} ${user.email || ''}`
  }));

  const updateForm = (formId: string, updates: Partial<FunctionalForm>) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addNewForm = () => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id))) + 1).toString();
    setForms(prev => [...prev, {
      id: newId,
      selectedUserId: '',
      fmsScores: {},
      selectedPosture: [],
      selectedSquatIssues: [],
      selectedSingleLegIssues: [],
      musclesNeedStrengthening: [],
      musclesNeedStretching: [],
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

    // Calculate FMS total
    const fmsTotal = Object.values(form.fmsScores).reduce((sum, score) => sum + score, 0);
    
    // Check if at least something is filled
    const hasData = fmsTotal > 0 || form.selectedPosture.length > 0 || 
                    form.selectedSquatIssues.length > 0 || form.selectedSingleLegIssues.length > 0;

    if (!hasData) {
      toast.error("Παρακαλώ συμπληρώστε τουλάχιστον ένα πεδίο");
      return;
    }

    updateForm(formId, { loading: true });

    try {
      // Create test session
      const { data: session, error: sessionError } = await supabase
        .from('functional_test_sessions')
        .insert({
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Λειτουργική Αξιολόγηση'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create functional data
      const { error: dataError } = await supabase
        .from('functional_test_data')
        .insert({
          test_session_id: session.id,
          fms_score: fmsTotal,
          fms_detailed_scores: form.fmsScores,
          posture_issues: form.selectedPosture,
          squat_issues: form.selectedSquatIssues,
          single_leg_squat_issues: form.selectedSingleLegIssues,
          // IMPORTANT: save the final muscle lists (after "Επόμενο" and after deletions)
          muscles_need_strengthening: form.musclesNeedStrengthening,
          muscles_need_stretching: form.musclesNeedStretching,
        });

      if (dataError) throw dataError;

      toast.success("Η καταγραφή αποθηκεύτηκε");

      // Reset form
      updateForm(formId, {
        selectedUserId: '',
        fmsScores: {},
        selectedPosture: [],
        selectedSquatIssues: [],
        selectedSingleLegIssues: [],
        musclesNeedStrengthening: [],
        musclesNeedStretching: [],
        loading: false
      });

      onRecordSaved();
    } catch (error) {
      console.error('Error saving functional data:', error);
      toast.error("Αποτυχία αποθήκευσης");
      updateForm(formId, { loading: false });
    }
  };

  return (
    <div className="space-y-2">
      {forms.map((form, formIndex) => (
        <Card key={form.id} className="rounded-none">
          <CardHeader className="pb-0.5 pt-1.5 px-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[11px]">
                Λειτουργικά {forms.length > 1 ? `#${formIndex + 1}` : ''}
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
          <CardContent className="p-2 pt-1 space-y-2">
            {/* User Selection */}
            <div className="flex gap-2 items-end">
              <div className="w-48">
                <Label className="text-[10px]">Ασκούμενος</Label>
                <Combobox
                  options={userOptions}
                  value={form.selectedUserId}
                  onValueChange={(val) => updateForm(form.id, {
                    selectedUserId: val,
                    musclesNeedStrengthening: [],
                    musclesNeedStretching: [],
                  })}
                  placeholder="Χρήστης"
                  emptyMessage="Δεν βρέθηκε."
                  className="h-5 text-[10px]"
                />
              </div>
              <Button
                onClick={() => handleSave(form.id)}
                disabled={form.loading}
                className="rounded-none h-5 px-2 bg-black hover:bg-black/90 text-white text-[10px]"
              >
                <Save className="w-3 h-3 mr-1" />
                Αποθήκευση
              </Button>
            </div>

            {/* Functional Tests */}
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
                musclesNeedStretching: muscles.stretch,
              })}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
