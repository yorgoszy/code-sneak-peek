import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Combobox } from "@/components/ui/combobox";

interface CoachJumpRecordTabProps {
  coachId: string;
  users: { id: string; name: string; email: string }[];
  onRecordSaved?: () => void;
}

type TestType = 'non-cmj' | 'cmj' | 'depth-jump' | 'broad-jump' | 'triple-jump';

interface JumpForm {
  id: string;
  selectedUserId: string;
  value: string;
  tripleJumpLeft?: string;
  tripleJumpRight?: string;
  loading: boolean;
  testType: TestType;
}

export const CoachJumpRecordTab: React.FC<CoachJumpRecordTabProps> = ({ coachId, users, onRecordSaved }) => {
  const { toast } = useToast();
  const [forms, setForms] = useState<JumpForm[]>([
    { id: '1', selectedUserId: '', value: '', loading: false, testType: 'non-cmj' },
    { id: '2', selectedUserId: '', value: '', loading: false, testType: 'cmj' },
    { id: '3', selectedUserId: '', value: '', loading: false, testType: 'depth-jump' },
    { id: '4', selectedUserId: '', value: '', loading: false, testType: 'broad-jump' },
    { id: '5', selectedUserId: '', value: '', tripleJumpLeft: '', tripleJumpRight: '', loading: false, testType: 'triple-jump' }
  ]);

  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: u.name, searchTerms: `${u.name} ${u.email}` })), [users]);

  const updateForm = (formId: string, updates: Partial<JumpForm>) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addForm = (testType: TestType) => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id)), 0) + 1).toString();
    const newForm: JumpForm = { id: newId, selectedUserId: '', value: '', loading: false, testType };
    if (testType === 'triple-jump') {
      newForm.tripleJumpLeft = '';
      newForm.tripleJumpRight = '';
    }
    setForms([...forms, newForm]);
  };

  const removeForm = (formId: string, testType: TestType) => {
    const formsOfType = forms.filter(f => f.testType === testType);
    if (formsOfType.length > 1) setForms(forms.filter(f => f.id !== formId));
  };

  const handleSave = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form || !form.selectedUserId) {
      toast({ title: "Σφάλμα", description: "Επιλέξτε αθλητή", variant: "destructive" });
      return;
    }

    if (form.testType === 'triple-jump') {
      if (!form.tripleJumpLeft && !form.tripleJumpRight) {
        toast({ title: "Σφάλμα", description: "Συμπληρώστε τουλάχιστον ένα πεδίο", variant: "destructive" });
        return;
      }
    } else if (!form.value) {
      toast({ title: "Σφάλμα", description: "Συμπληρώστε το ύψος", variant: "destructive" });
      return;
    }

    updateForm(formId, { loading: true });
    try {
      const testNames: Record<TestType, string> = {
        'non-cmj': 'Non-CMJ Test',
        'cmj': 'CMJ Test',
        'depth-jump': 'Depth Jump Test',
        'broad-jump': 'Broad Jump Test',
        'triple-jump': 'Triple Jump Test'
      };

      const { data: session, error: sessionError } = await supabase
        .from('coach_jump_test_sessions')
        .insert({
          coach_id: coachId,
          user_id: form.selectedUserId,
          test_date: format(new Date(), 'yyyy-MM-dd'),
          notes: testNames[form.testType]
        } as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_jump_test_data')
        .insert({
          test_session_id: session.id,
          non_counter_movement_jump: form.testType === 'non-cmj' ? parseFloat(form.value) : null,
          counter_movement_jump: form.testType === 'cmj' ? parseFloat(form.value) : null,
          depth_jump: form.testType === 'depth-jump' ? parseFloat(form.value) : null,
          broad_jump: form.testType === 'broad-jump' ? parseFloat(form.value) : null,
          triple_jump_left: form.testType === 'triple-jump' && form.tripleJumpLeft ? parseFloat(form.tripleJumpLeft) : null,
          triple_jump_right: form.testType === 'triple-jump' && form.tripleJumpRight ? parseFloat(form.tripleJumpRight) : null
        });

      if (dataError) throw dataError;

      toast({ title: "Επιτυχία", description: "Η καταγραφή αποθηκεύτηκε" });
      const reset: Partial<JumpForm> = { value: '', loading: false };
      if (form.testType === 'triple-jump') {
        reset.tripleJumpLeft = '';
        reset.tripleJumpRight = '';
      }
      updateForm(formId, reset);
      onRecordSaved?.();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία αποθήκευσης", variant: "destructive" });
      updateForm(formId, { loading: false });
    }
  };

  const renderFormGroup = (testType: TestType, title: string) => {
    const typeForms = forms.filter(f => f.testType === testType);
    
    return (
      <div className="space-y-1">
        {typeForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-60">
            <CardHeader className="pb-0.5 pt-1 px-2">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs">{title} {typeForms.length > 1 ? `#${idx + 1}` : ''}</CardTitle>
                <Button onClick={() => addForm(testType)} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {typeForms.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeForm(form.id, testType)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-1 space-y-1">
              <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateForm(form.id, { selectedUserId: v })} placeholder="Αθλητής" className="h-6 text-[10px]" />
              {testType === 'triple-jump' ? (
                <div className="flex gap-1">
                  <div className="flex-1">
                    <Label className="text-[9px]">Left (cm)</Label>
                    <Input type="number" value={form.tripleJumpLeft || ''} onChange={(e) => updateForm(form.id, { tripleJumpLeft: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[9px]">Right (cm)</Label>
                    <Input type="number" value={form.tripleJumpRight || ''} onChange={(e) => updateForm(form.id, { tripleJumpRight: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-end">
                  <div className="w-16">
                    <Label className="text-[9px]">cm</Label>
                    <Input type="number" value={form.value} onChange={(e) => updateForm(form.id, { value: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                  </div>
                  <Button onClick={() => handleSave(form.id)} className="rounded-none h-5 w-5 p-0" disabled={form.loading}><Save className="w-2.5 h-2.5" /></Button>
                </div>
              )}
              {testType === 'triple-jump' && (
                <Button onClick={() => handleSave(form.id)} className="rounded-none h-5 w-full text-[10px]" disabled={form.loading}><Save className="w-2.5 h-2.5 mr-1" />Αποθήκευση</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {renderFormGroup('non-cmj', 'Non-CMJ')}
      {renderFormGroup('cmj', 'CMJ')}
      {renderFormGroup('depth-jump', 'Depth Jump')}
      {renderFormGroup('broad-jump', 'Broad Jump')}
      {renderFormGroup('triple-jump', 'Triple Jump')}
    </div>
  );
};
