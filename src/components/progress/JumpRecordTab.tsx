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

interface JumpRecordTabProps {
  users: any[];
  onRecordSaved?: () => void;
}

interface JumpForm {
  id: string;
  selectedUserId: string;
  cmjHeight: string;
  loading: boolean;
  testType: 'non-cmj' | 'cmj' | 'depth-jump' | 'broad-jump';
}

export const JumpRecordTab: React.FC<JumpRecordTabProps> = ({ users, onRecordSaved }) => {
  const { toast } = useToast();
  const [forms, setForms] = useState<JumpForm[]>([
    { id: '1', selectedUserId: '', cmjHeight: '', loading: false, testType: 'non-cmj' },
    { id: '2', selectedUserId: '', cmjHeight: '', loading: false, testType: 'cmj' },
    { id: '3', selectedUserId: '', cmjHeight: '', loading: false, testType: 'depth-jump' },
    { id: '4', selectedUserId: '', cmjHeight: '', loading: false, testType: 'broad-jump' }
  ]);

  const userOptions = useMemo(() => 
    (users || []).map(user => ({ 
      value: user.id, 
      label: user.name,
      searchTerms: `${user.name} ${user.email || ''}`
    })),
    [users]
  );

  const addNewForm = (testType: 'non-cmj' | 'cmj' | 'depth-jump' | 'broad-jump') => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id))) + 1).toString();
    setForms([...forms, {
      id: newId,
      selectedUserId: '',
      cmjHeight: '',
      loading: false,
      testType
    }]);
  };

  const removeForm = (formId: string, testType: 'non-cmj' | 'cmj' | 'depth-jump' | 'broad-jump') => {
    const formsOfType = forms.filter(f => f.testType === testType);
    if (formsOfType.length > 1) {
      setForms(forms.filter(f => f.id !== formId));
    }
  };

  const updateForm = (formId: string, updates: Partial<JumpForm>) => {
    setForms(prevForms => prevForms.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const handleSave = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    
    if (!form.selectedUserId || !form.cmjHeight) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
        variant: "destructive",
      });
      return;
    }

    updateForm(formId, { loading: true });

    try {
      // Create jump test session
      const testName = form.testType === 'cmj' ? 'CMJ Test' : 
                       form.testType === 'depth-jump' ? 'Depth Jump Test' :
                       form.testType === 'broad-jump' ? 'Broad Jump Test' :
                       'Non-CMJ Test';
      const { data: session, error: sessionError } = await supabase
        .from('jump_test_sessions')
        .insert({
          user_id: form.selectedUserId,
          test_date: format(new Date(), 'yyyy-MM-dd'),
          notes: `${testName} - ${form.cmjHeight}cm`
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create jump test data
      const { error: dataError } = await supabase
        .from('jump_test_data')
        .insert({
          test_session_id: session.id,
          non_counter_movement_jump: form.testType === 'non-cmj' ? parseFloat(form.cmjHeight) : null,
          counter_movement_jump: form.testType === 'cmj' ? parseFloat(form.cmjHeight) : null,
          depth_jump: form.testType === 'depth-jump' ? parseFloat(form.cmjHeight) : null,
          broad_jump: form.testType === 'broad-jump' ? parseFloat(form.cmjHeight) : null,
          triple_jump_left: null,
          triple_jump_right: null
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή αποθηκεύτηκε",
      });

      // Reset form
      updateForm(formId, {
        cmjHeight: '',
        loading: false
      });
      
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving jump test:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση",
        variant: "destructive",
      });
      
      updateForm(formId, { loading: false });
    }
  };

  return (
    <div className="flex gap-2">
      {/* Non-CMJ Forms */}
      <div className="space-y-[1px]">
        {forms.filter(f => f.testType === 'non-cmj').map((form, formIndex) => {
          const formsOfType = forms.filter(f => f.testType === 'non-cmj');
          return (
            <Card key={form.id} className="rounded-none w-60">
              <CardHeader className="pb-0.5 pt-1 px-2">
                <div className="flex items-center gap-1">
                  <CardTitle className="text-xs">Non-CMJ {formsOfType.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                  <Button onClick={() => addNewForm('non-cmj')} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto">
                    <Plus className="w-2.5 h-2.5" />
                  </Button>
                  {formsOfType.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeForm(form.id, 'non-cmj')}
                      className="rounded-none h-4 w-4 p-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-1 space-y-1">
                <div>
                  <Label className="text-[10px]">Ασκούμενος</Label>
                  <Combobox
                    options={userOptions}
                    value={form.selectedUserId}
                    onValueChange={(val) => updateForm(form.id, { selectedUserId: val })}
                    placeholder="Χρήστης"
                    emptyMessage="Δεν βρέθηκε."
                    className="h-6 text-[10px]"
                  />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-16">
                    <Label className="text-[10px]">cm</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={form.cmjHeight}
                      onChange={(e) => updateForm(form.id, { cmjHeight: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[10px]"
                    />
                  </div>
                  <Button 
                    onClick={() => handleSave(form.id)} 
                    className="rounded-none h-6 w-6 p-0"
                    disabled={form.loading}
                  >
                    <Save className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CMJ Forms */}
      <div className="space-y-[1px]">
        {forms.filter(f => f.testType === 'cmj').map((form, formIndex) => {
          const formsOfType = forms.filter(f => f.testType === 'cmj');
          return (
            <Card key={form.id} className="rounded-none w-60">
              <CardHeader className="pb-0.5 pt-1 px-2">
                <div className="flex items-center gap-1">
                  <CardTitle className="text-xs">CMJ {formsOfType.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                  <Button onClick={() => addNewForm('cmj')} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto">
                    <Plus className="w-2.5 h-2.5" />
                  </Button>
                  {formsOfType.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeForm(form.id, 'cmj')}
                      className="rounded-none h-4 w-4 p-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-1 space-y-1">
                <div>
                  <Label className="text-[10px]">Ασκούμενος</Label>
                  <Combobox
                    options={userOptions}
                    value={form.selectedUserId}
                    onValueChange={(val) => updateForm(form.id, { selectedUserId: val })}
                    placeholder="Χρήστης"
                    emptyMessage="Δεν βρέθηκε."
                    className="h-6 text-[10px]"
                  />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-16">
                    <Label className="text-[10px]">cm</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={form.cmjHeight}
                      onChange={(e) => updateForm(form.id, { cmjHeight: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[10px]"
                    />
                  </div>
                  <Button 
                    onClick={() => handleSave(form.id)} 
                    className="rounded-none h-6 w-6 p-0"
                    disabled={form.loading}
                  >
                    <Save className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Depth Jump Forms */}
      <div className="space-y-[1px]">
        {forms.filter(f => f.testType === 'depth-jump').map((form, formIndex) => {
          const formsOfType = forms.filter(f => f.testType === 'depth-jump');
          return (
            <Card key={form.id} className="rounded-none w-60">
              <CardHeader className="pb-0.5 pt-1 px-2">
                <div className="flex items-center gap-1">
                  <CardTitle className="text-xs">Depth Jump {formsOfType.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                  <Button onClick={() => addNewForm('depth-jump')} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto">
                    <Plus className="w-2.5 h-2.5" />
                  </Button>
                  {formsOfType.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeForm(form.id, 'depth-jump')}
                      className="rounded-none h-4 w-4 p-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-1 space-y-1">
                <div>
                  <Label className="text-[10px]">Ασκούμενος</Label>
                  <Combobox
                    options={userOptions}
                    value={form.selectedUserId}
                    onValueChange={(val) => updateForm(form.id, { selectedUserId: val })}
                    placeholder="Χρήστης"
                    emptyMessage="Δεν βρέθηκε."
                    className="h-6 text-[10px]"
                  />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-16">
                    <Label className="text-[10px]">cm</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={form.cmjHeight}
                      onChange={(e) => updateForm(form.id, { cmjHeight: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[10px]"
                    />
                  </div>
                  <Button 
                    onClick={() => handleSave(form.id)} 
                    className="rounded-none h-6 w-6 p-0"
                    disabled={form.loading}
                  >
                    <Save className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Broad Jump Forms */}
      <div className="space-y-[1px]">
        {forms.filter(f => f.testType === 'broad-jump').map((form, formIndex) => {
          const formsOfType = forms.filter(f => f.testType === 'broad-jump');
          return (
            <Card key={form.id} className="rounded-none w-60">
              <CardHeader className="pb-0.5 pt-1 px-2">
                <div className="flex items-center gap-1">
                  <CardTitle className="text-xs">Broad Jump {formsOfType.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                  <Button onClick={() => addNewForm('broad-jump')} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto">
                    <Plus className="w-2.5 h-2.5" />
                  </Button>
                  {formsOfType.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeForm(form.id, 'broad-jump')}
                      className="rounded-none h-4 w-4 p-0"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-1 space-y-1">
                <div>
                  <Label className="text-[10px]">Ασκούμενος</Label>
                  <Combobox
                    options={userOptions}
                    value={form.selectedUserId}
                    onValueChange={(val) => updateForm(form.id, { selectedUserId: val })}
                    placeholder="Χρήστης"
                    emptyMessage="Δεν βρέθηκε."
                    className="h-6 text-[10px]"
                  />
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-16">
                    <Label className="text-[10px]">cm</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={form.cmjHeight}
                      onChange={(e) => updateForm(form.id, { cmjHeight: e.target.value })}
                      className="rounded-none no-spinners h-6 text-[10px]"
                    />
                  </div>
                  <Button 
                    onClick={() => handleSave(form.id)} 
                    className="rounded-none h-6 w-6 p-0"
                    disabled={form.loading}
                  >
                    <Save className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
