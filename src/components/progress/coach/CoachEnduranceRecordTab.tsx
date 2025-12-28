import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";

interface CoachUser {
  id: string; // coach_users.id
  name: string;
  email: string;
}

interface CoachEnduranceRecordTabProps {
  coachId: string;
  users: CoachUser[];
  exercises: any[];
  onRecordSaved?: () => void;
}

interface MasForm {
  id: string;
  selectedUserId: string; // coach_users.id
  selectedExerciseId: string;
  distance: string;
  duration: string;
  maxHr: string;
  restingHr1min: string;
  loading: boolean;
}

interface CardiacForm {
  id: string;
  selectedUserId: string;
  maxHr: string;
  restingHr1min: string;
  loading: boolean;
}

interface Vo2MaxForm {
  id: string;
  selectedUserId: string;
  vo2Max: string;
  loading: boolean;
}

export const CoachEnduranceRecordTab: React.FC<CoachEnduranceRecordTabProps> = ({ 
  coachId,
  users, 
  exercises,
  onRecordSaved 
}) => {
  const { toast } = useToast();
  
  const [masForms, setMasForms] = useState<MasForm[]>([
    { id: '1', selectedUserId: '', selectedExerciseId: '', distance: '', duration: '', maxHr: '', restingHr1min: '', loading: false }
  ]);

  const [cardiacForms, setCardiacForms] = useState<CardiacForm[]>([
    { id: '1', selectedUserId: '', maxHr: '', restingHr1min: '', loading: false }
  ]);

  const [vo2MaxForms, setVo2MaxForms] = useState<Vo2MaxForm[]>([
    { id: '1', selectedUserId: '', vo2Max: '', loading: false }
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

  // MAS form helpers
  const updateMasForm = (formId: string, updates: Partial<MasForm>) => {
    setMasForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addMasForm = () => {
    const newId = (Math.max(...masForms.map(f => parseInt(f.id)), 0) + 1).toString();
    setMasForms([...masForms, { id: newId, selectedUserId: '', selectedExerciseId: '', distance: '', duration: '', maxHr: '', restingHr1min: '', loading: false }]);
  };

  const removeMasForm = (formId: string) => {
    if (masForms.length > 1) setMasForms(masForms.filter(f => f.id !== formId));
  };

  const handleMasSave = async (formId: string) => {
    const form = masForms.find(f => f.id === formId);
    if (!form || !form.selectedUserId) {
      toast({ title: "Σφάλμα", description: "Επιλέξτε αθλητή", variant: "destructive" });
      return;
    }

    const dist = parseFloat(form.distance);
    const dur = parseFloat(form.duration);
    if (!dist || !dur) {
      toast({ title: "Σφάλμα", description: "Συμπληρώστε απόσταση και διάρκεια", variant: "destructive" });
      return;
    }

    updateMasForm(formId, { loading: true });
    try {
      // Create coach endurance session
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          coach_user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'MAS Test'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const mas = dist / (dur * 60);
      const masKmh = mas * 3.6;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          mas_meters: dist,
          mas_minutes: dur,
          mas_ms: mas,
          mas_kmh: masKmh,
          max_hr: form.maxHr ? parseInt(form.maxHr) : null,
          resting_hr_1min: form.restingHr1min ? parseInt(form.restingHr1min) : null
        });

      if (dataError) throw dataError;

      toast({ title: "Επιτυχία", description: "MAS Test αποθηκεύτηκε" });
      updateMasForm(formId, { distance: '', duration: '', maxHr: '', restingHr1min: '', loading: false });
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving MAS:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία αποθήκευσης", variant: "destructive" });
      updateMasForm(formId, { loading: false });
    }
  };

  // Cardiac form helpers
  const updateCardiacForm = (formId: string, updates: Partial<CardiacForm>) => {
    setCardiacForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addCardiacForm = () => {
    const newId = (Math.max(...cardiacForms.map(f => parseInt(f.id)), 0) + 1).toString();
    setCardiacForms([...cardiacForms, { id: newId, selectedUserId: '', maxHr: '', restingHr1min: '', loading: false }]);
  };

  const removeCardiacForm = (formId: string) => {
    if (cardiacForms.length > 1) setCardiacForms(cardiacForms.filter(f => f.id !== formId));
  };

  const handleCardiacSave = async (formId: string) => {
    const form = cardiacForms.find(f => f.id === formId);
    if (!form || !form.selectedUserId) {
      toast({ title: "Σφάλμα", description: "Επιλέξτε αθλητή", variant: "destructive" });
      return;
    }

    const maxHr = form.maxHr ? parseInt(form.maxHr) : null;
    const restingHr = form.restingHr1min ? parseInt(form.restingHr1min) : null;

    if (!maxHr && !restingHr) {
      toast({ title: "Σφάλμα", description: "Συμπληρώστε τουλάχιστον ένα πεδίο", variant: "destructive" });
      return;
    }

    updateCardiacForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          coach_user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Cardiac Data'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          max_hr: maxHr,
          resting_hr_1min: restingHr
        });

      if (dataError) throw dataError;

      toast({ title: "Επιτυχία", description: "Cardiac Data αποθηκεύτηκε" });
      updateCardiacForm(formId, { maxHr: '', restingHr1min: '', loading: false });
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving Cardiac:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία αποθήκευσης", variant: "destructive" });
      updateCardiacForm(formId, { loading: false });
    }
  };

  // VO2 Max form helpers
  const updateVo2Form = (formId: string, updates: Partial<Vo2MaxForm>) => {
    setVo2MaxForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const addVo2Form = () => {
    const newId = (Math.max(...vo2MaxForms.map(f => parseInt(f.id)), 0) + 1).toString();
    setVo2MaxForms([...vo2MaxForms, { id: newId, selectedUserId: '', vo2Max: '', loading: false }]);
  };

  const removeVo2Form = (formId: string) => {
    if (vo2MaxForms.length > 1) setVo2MaxForms(vo2MaxForms.filter(f => f.id !== formId));
  };

  const handleVo2Save = async (formId: string) => {
    const form = vo2MaxForms.find(f => f.id === formId);
    if (!form || !form.selectedUserId || !form.vo2Max) {
      toast({ title: "Σφάλμα", description: "Συμπληρώστε όλα τα πεδία", variant: "destructive" });
      return;
    }

    updateVo2Form(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          coach_user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'VO2 Max'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          vo2_max: parseFloat(form.vo2Max)
        });

      if (dataError) throw dataError;

      toast({ title: "Επιτυχία", description: "VO2 Max αποθηκεύτηκε" });
      updateVo2Form(formId, { vo2Max: '', loading: false });
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving VO2:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία αποθήκευσης", variant: "destructive" });
      updateVo2Form(formId, { loading: false });
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {/* MAS Forms */}
      <div className="space-y-1">
        <div className="text-xs font-semibold px-1">MAS Test</div>
        {masForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-64">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addMasForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {masForms.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeMasForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>
                )}
              </div>
              <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateMasForm(form.id, { selectedUserId: v })} placeholder="Αθλητής" className="h-6 text-[10px]" />
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <Label className="text-[9px]">Απόσταση (m)</Label>
                  <Input type="number" value={form.distance} onChange={(e) => updateMasForm(form.id, { distance: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
                <div>
                  <Label className="text-[9px]">Διάρκεια (min)</Label>
                  <Input type="number" value={form.duration} onChange={(e) => updateMasForm(form.id, { duration: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
              </div>
              <Button onClick={() => handleMasSave(form.id)} disabled={form.loading} className="rounded-none h-5 w-full text-[10px]">
                <Save className="w-3 h-3 mr-1" /> Αποθήκευση
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cardiac Forms */}
      <div className="space-y-1">
        <div className="text-xs font-semibold px-1">Cardiac Data</div>
        {cardiacForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-52">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addCardiacForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {cardiacForms.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeCardiacForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>
                )}
              </div>
              <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateCardiacForm(form.id, { selectedUserId: v })} placeholder="Αθλητής" className="h-6 text-[10px]" />
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <Label className="text-[9px]">Max HR</Label>
                  <Input type="number" value={form.maxHr} onChange={(e) => updateCardiacForm(form.id, { maxHr: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
                <div>
                  <Label className="text-[9px]">Resting HR</Label>
                  <Input type="number" value={form.restingHr1min} onChange={(e) => updateCardiacForm(form.id, { restingHr1min: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
              </div>
              <Button onClick={() => handleCardiacSave(form.id)} disabled={form.loading} className="rounded-none h-5 w-full text-[10px]">
                <Save className="w-3 h-3 mr-1" /> Αποθήκευση
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* VO2 Max Forms */}
      <div className="space-y-1">
        <div className="text-xs font-semibold px-1">VO2 Max</div>
        {vo2MaxForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-44">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addVo2Form} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {vo2MaxForms.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeVo2Form(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>
                )}
              </div>
              <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateVo2Form(form.id, { selectedUserId: v })} placeholder="Αθλητής" className="h-6 text-[10px]" />
              <div>
                <Label className="text-[9px]">VO2 Max</Label>
                <Input type="number" value={form.vo2Max} onChange={(e) => updateVo2Form(form.id, { vo2Max: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
              </div>
              <Button onClick={() => handleVo2Save(form.id)} disabled={form.loading} className="rounded-none h-5 w-full text-[10px]">
                <Save className="w-3 h-3 mr-1" /> Αποθήκευση
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
