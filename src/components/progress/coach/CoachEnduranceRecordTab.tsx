import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";

interface CoachUser {
  id: string;
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
  selectedUserId: string;
  distance: string;
  duration: string;
  maxHr: string;
  restingHr1min: string;
  loading: boolean;
}

interface BodyweightForm {
  id: string;
  selectedUserId: string;
  pushUps: string;
  pullUps: string;
  crunches: string;
  t2b: string;
  loading: boolean;
}

interface FarmerForm {
  id: string;
  selectedUserId: string;
  farmerKg: string;
  farmerMeters: string;
  farmerSeconds: string;
  loading: boolean;
}

interface SprintForm {
  id: string;
  selectedUserId: string;
  sprintSeconds: string;
  sprintMeters: string;
  sprintResistance: string;
  sprintKmh: string;
  sprintExercise: string;
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
    { id: '1', selectedUserId: '', distance: '', duration: '', maxHr: '', restingHr1min: '', loading: false }
  ]);

  const [bodyweightForms, setBodyweightForms] = useState<BodyweightForm[]>([
    { id: '1', selectedUserId: '', pushUps: '', pullUps: '', crunches: '', t2b: '', loading: false }
  ]);

  const [farmerForms, setFarmerForms] = useState<FarmerForm[]>([
    { id: '1', selectedUserId: '', farmerKg: '', farmerMeters: '', farmerSeconds: '', loading: false }
  ]);

  const [sprintForms, setSprintForms] = useState<SprintForm[]>([
    { id: '1', selectedUserId: '', sprintSeconds: '', sprintMeters: '', sprintResistance: '', sprintKmh: '', sprintExercise: 'track', loading: false }
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

  // ======= MAS =======
  const updateMasForm = (formId: string, updates: Partial<MasForm>) => {
    setMasForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };
  const addMasForm = () => {
    const newId = (Math.max(...masForms.map(f => parseInt(f.id)), 0) + 1).toString();
    setMasForms([...masForms, { id: newId, selectedUserId: '', distance: '', duration: '', maxHr: '', restingHr1min: '', loading: false }]);
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
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({ coach_id: coachId, coach_user_id: form.selectedUserId, test_date: new Date().toISOString().split('T')[0], notes: 'MAS Test' })
        .select().single();
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

  // ======= Bodyweight =======
  const updateBodyweightForm = (formId: string, updates: Partial<BodyweightForm>) => {
    setBodyweightForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };
  const addBodyweightForm = () => {
    const newId = (Math.max(...bodyweightForms.map(f => parseInt(f.id)), 0) + 1).toString();
    setBodyweightForms([...bodyweightForms, { id: newId, selectedUserId: '', pushUps: '', pullUps: '', crunches: '', t2b: '', loading: false }]);
  };
  const removeBodyweightForm = (formId: string) => {
    if (bodyweightForms.length > 1) setBodyweightForms(bodyweightForms.filter(f => f.id !== formId));
  };
  const handleBodyweightSave = async (formId: string) => {
    const form = bodyweightForms.find(f => f.id === formId);
    if (!form || !form.selectedUserId) {
      toast({ title: "Σφάλμα", description: "Επιλέξτε αθλητή", variant: "destructive" });
      return;
    }
    if (!form.pushUps && !form.pullUps && !form.crunches && !form.t2b) {
      toast({ title: "Σφάλμα", description: "Συμπληρώστε τουλάχιστον ένα πεδίο", variant: "destructive" });
      return;
    }
    updateBodyweightForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({ coach_id: coachId, coach_user_id: form.selectedUserId, test_date: new Date().toISOString().split('T')[0], notes: 'Bodyweight Test' })
        .select().single();
      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          push_ups: form.pushUps ? parseInt(form.pushUps) : null,
          pull_ups: form.pullUps ? parseInt(form.pullUps) : null,
          crunches: form.crunches ? parseInt(form.crunches) : null,
          t2b: form.t2b ? parseInt(form.t2b) : null
        });
      if (dataError) throw dataError;

      toast({ title: "Επιτυχία", description: "Bodyweight αποθηκεύτηκε" });
      updateBodyweightForm(formId, { pushUps: '', pullUps: '', crunches: '', t2b: '', loading: false });
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving Bodyweight:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία αποθήκευσης", variant: "destructive" });
      updateBodyweightForm(formId, { loading: false });
    }
  };

  // ======= Farmer =======
  const updateFarmerForm = (formId: string, updates: Partial<FarmerForm>) => {
    setFarmerForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };
  const addFarmerForm = () => {
    const newId = (Math.max(...farmerForms.map(f => parseInt(f.id)), 0) + 1).toString();
    setFarmerForms([...farmerForms, { id: newId, selectedUserId: '', farmerKg: '', farmerMeters: '', farmerSeconds: '', loading: false }]);
  };
  const removeFarmerForm = (formId: string) => {
    if (farmerForms.length > 1) setFarmerForms(farmerForms.filter(f => f.id !== formId));
  };
  const handleFarmerSave = async (formId: string) => {
    const form = farmerForms.find(f => f.id === formId);
    if (!form || !form.selectedUserId) {
      toast({ title: "Σφάλμα", description: "Επιλέξτε αθλητή", variant: "destructive" });
      return;
    }
    if (!form.farmerKg && !form.farmerMeters && !form.farmerSeconds) {
      toast({ title: "Σφάλμα", description: "Συμπληρώστε τουλάχιστον ένα πεδίο", variant: "destructive" });
      return;
    }
    updateFarmerForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({ coach_id: coachId, coach_user_id: form.selectedUserId, test_date: new Date().toISOString().split('T')[0], notes: 'Farmer Test' })
        .select().single();
      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          farmer_kg: form.farmerKg ? parseFloat(form.farmerKg) : null,
          farmer_meters: form.farmerMeters ? parseFloat(form.farmerMeters) : null,
          farmer_seconds: form.farmerSeconds ? parseFloat(form.farmerSeconds) : null
        });
      if (dataError) throw dataError;

      toast({ title: "Επιτυχία", description: "Farmer Test αποθηκεύτηκε" });
      updateFarmerForm(formId, { farmerKg: '', farmerMeters: '', farmerSeconds: '', loading: false });
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving Farmer:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία αποθήκευσης", variant: "destructive" });
      updateFarmerForm(formId, { loading: false });
    }
  };

  // ======= Sprint =======
  const updateSprintForm = (formId: string, updates: Partial<SprintForm>) => {
    setSprintForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f));
  };
  const addSprintForm = () => {
    const newId = (Math.max(...sprintForms.map(f => parseInt(f.id)), 0) + 1).toString();
    setSprintForms([...sprintForms, { id: newId, selectedUserId: '', sprintSeconds: '', sprintMeters: '', sprintResistance: '', sprintKmh: '', sprintExercise: 'track', loading: false }]);
  };
  const removeSprintForm = (formId: string) => {
    if (sprintForms.length > 1) setSprintForms(sprintForms.filter(f => f.id !== formId));
  };
  const calculateSprintMetrics = (form: SprintForm) => {
    const seconds = parseFloat(form.sprintSeconds);
    if (!seconds || seconds <= 0) return { kmh: '', meters: '' };
    if (form.sprintExercise === 'track') {
      const meters = parseFloat(form.sprintMeters);
      if (!meters || meters <= 0) return { kmh: '', meters: form.sprintMeters };
      const ms = meters / seconds;
      const kmh = ms * 3.6;
      return { kmh: kmh.toFixed(2), meters: form.sprintMeters };
    } else {
      const kmh = parseFloat(form.sprintKmh);
      if (!kmh || kmh <= 0) return { kmh: form.sprintKmh, meters: '' };
      const ms = kmh / 3.6;
      const meters = ms * seconds;
      return { kmh: form.sprintKmh, meters: meters.toFixed(2) };
    }
  };
  const handleSprintSave = async (formId: string) => {
    const form = sprintForms.find(f => f.id === formId);
    if (!form || !form.selectedUserId) {
      toast({ title: "Σφάλμα", description: "Επιλέξτε αθλητή", variant: "destructive" });
      return;
    }
    if (!form.sprintSeconds) {
      toast({ title: "Σφάλμα", description: "Συμπληρώστε τον χρόνο", variant: "destructive" });
      return;
    }
    updateSprintForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({ coach_id: coachId, coach_user_id: form.selectedUserId, test_date: new Date().toISOString().split('T')[0], notes: 'Sprint Test' })
        .select().single();
      if (sessionError) throw sessionError;

      const metrics = calculateSprintMetrics(form);
      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          sprint_seconds: parseFloat(form.sprintSeconds),
          sprint_meters: metrics.meters ? parseFloat(metrics.meters) : null,
          sprint_resistance: form.sprintResistance || null
        });
      if (dataError) throw dataError;

      toast({ title: "Επιτυχία", description: "Sprint Test αποθηκεύτηκε" });
      updateSprintForm(formId, { sprintSeconds: '', sprintMeters: '', sprintResistance: '', sprintKmh: '', loading: false });
      onRecordSaved?.();
    } catch (error) {
      console.error('Error saving Sprint:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία αποθήκευσης", variant: "destructive" });
      updateSprintForm(formId, { loading: false });
    }
  };

  // ======= Cardiac =======
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
        .insert({ coach_id: coachId, coach_user_id: form.selectedUserId, test_date: new Date().toISOString().split('T')[0], notes: 'Cardiac Data' })
        .select().single();
      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({ test_session_id: session.id, max_hr: maxHr, resting_hr_1min: restingHr });
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

  // ======= VO2 Max =======
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
        .insert({ coach_id: coachId, coach_user_id: form.selectedUserId, test_date: new Date().toISOString().split('T')[0], notes: 'VO2 Max' })
        .select().single();
      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({ test_session_id: session.id, vo2_max: parseFloat(form.vo2Max) });
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
      <div className="space-y-1 shrink-0">
        <div className="text-xs font-semibold px-1">MAS Test</div>
        {masForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-56">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addMasForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {masForms.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeMasForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>}
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

      {/* Bodyweight Forms */}
      <div className="space-y-1 shrink-0">
        <div className="text-xs font-semibold px-1">Bodyweight</div>
        {bodyweightForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-56">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addBodyweightForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {bodyweightForms.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeBodyweightForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>}
              </div>
              <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateBodyweightForm(form.id, { selectedUserId: v })} placeholder="Αθλητής" className="h-6 text-[10px]" />
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <Label className="text-[9px]">Push-ups</Label>
                  <Input type="number" value={form.pushUps} onChange={(e) => updateBodyweightForm(form.id, { pushUps: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
                <div>
                  <Label className="text-[9px]">Pull-ups</Label>
                  <Input type="number" value={form.pullUps} onChange={(e) => updateBodyweightForm(form.id, { pullUps: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
                <div>
                  <Label className="text-[9px]">Crunches</Label>
                  <Input type="number" value={form.crunches} onChange={(e) => updateBodyweightForm(form.id, { crunches: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
                <div>
                  <Label className="text-[9px]">T2B</Label>
                  <Input type="number" value={form.t2b} onChange={(e) => updateBodyweightForm(form.id, { t2b: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
              </div>
              <Button onClick={() => handleBodyweightSave(form.id)} disabled={form.loading} className="rounded-none h-5 w-full text-[10px]">
                <Save className="w-3 h-3 mr-1" /> Αποθήκευση
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Farmer Forms */}
      <div className="space-y-1 shrink-0">
        <div className="text-xs font-semibold px-1">Farmer Test</div>
        {farmerForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-52">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addFarmerForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {farmerForms.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeFarmerForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>}
              </div>
              <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateFarmerForm(form.id, { selectedUserId: v })} placeholder="Αθλητής" className="h-6 text-[10px]" />
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <Label className="text-[9px]">kg</Label>
                  <Input type="number" value={form.farmerKg} onChange={(e) => updateFarmerForm(form.id, { farmerKg: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
                <div>
                  <Label className="text-[9px]">m</Label>
                  <Input type="number" value={form.farmerMeters} onChange={(e) => updateFarmerForm(form.id, { farmerMeters: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
                <div>
                  <Label className="text-[9px]">sec</Label>
                  <Input type="number" value={form.farmerSeconds} onChange={(e) => updateFarmerForm(form.id, { farmerSeconds: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
              </div>
              <Button onClick={() => handleFarmerSave(form.id)} disabled={form.loading} className="rounded-none h-5 w-full text-[10px]">
                <Save className="w-3 h-3 mr-1" /> Αποθήκευση
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sprint Forms */}
      <div className="space-y-1 shrink-0">
        <div className="text-xs font-semibold px-1">Sprint Test</div>
        {sprintForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-56">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addSprintForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {sprintForms.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeSprintForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>}
              </div>
              <Combobox options={userOptions} value={form.selectedUserId} onValueChange={(v) => updateSprintForm(form.id, { selectedUserId: v })} placeholder="Αθλητής" className="h-6 text-[10px]" />
              <Select value={form.sprintExercise} onValueChange={(v) => updateSprintForm(form.id, { sprintExercise: v })}>
                <SelectTrigger className="h-5 text-[10px] rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="track">Track</SelectItem>
                  <SelectItem value="woodway">Woodway</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <Label className="text-[9px]">Χρόνος (sec)</Label>
                  <Input type="number" value={form.sprintSeconds} onChange={(e) => updateSprintForm(form.id, { sprintSeconds: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                </div>
                {form.sprintExercise === 'track' ? (
                  <div>
                    <Label className="text-[9px]">Απόσταση (m)</Label>
                    <Input type="number" value={form.sprintMeters} onChange={(e) => updateSprintForm(form.id, { sprintMeters: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                  </div>
                ) : (
                  <div>
                    <Label className="text-[9px]">Ταχύτητα (km/h)</Label>
                    <Input type="number" value={form.sprintKmh} onChange={(e) => updateSprintForm(form.id, { sprintKmh: e.target.value })} className="rounded-none h-5 text-[10px] no-spinners" />
                  </div>
                )}
              </div>
              <div>
                <Label className="text-[9px]">Αντίσταση</Label>
                <Input value={form.sprintResistance} onChange={(e) => updateSprintForm(form.id, { sprintResistance: e.target.value })} className="rounded-none h-5 text-[10px]" placeholder="π.χ. 10%" />
              </div>
              <Button onClick={() => handleSprintSave(form.id)} disabled={form.loading} className="rounded-none h-5 w-full text-[10px]">
                <Save className="w-3 h-3 mr-1" /> Αποθήκευση
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cardiac Forms */}
      <div className="space-y-1 shrink-0">
        <div className="text-xs font-semibold px-1">Cardiac Data</div>
        {cardiacForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-44">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addCardiacForm} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {cardiacForms.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeCardiacForm(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>}
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
      <div className="space-y-1 shrink-0">
        <div className="text-xs font-semibold px-1">VO2 Max</div>
        {vo2MaxForms.map((form, idx) => (
          <Card key={form.id} className="rounded-none w-40">
            <CardContent className="p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium">#{idx + 1}</span>
                <Button onClick={addVo2Form} size="sm" className="rounded-none h-4 w-4 p-0 ml-auto"><Plus className="w-2.5 h-2.5" /></Button>
                {vo2MaxForms.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeVo2Form(form.id)} className="h-4 w-4 p-0"><Trash2 className="w-2.5 h-2.5" /></Button>}
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
