import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  selectedExerciseId: string;
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
  
  const [forms, setForms] = useState<MasForm[]>([
    { id: '1', selectedUserId: '', selectedExerciseId: '', distance: '', duration: '', maxHr: '', restingHr1min: '', loading: false }
  ]);

  const [bodyweightForms, setBodyweightForms] = useState<BodyweightForm[]>([
    { id: '1', selectedUserId: '', pushUps: '', pullUps: '', t2b: '', loading: false }
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

  // Calculate km/h or meters for sprint
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

  // ============ MAS Forms ============
  const addNewForm = () => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id))) + 1).toString();
    setForms([...forms, {
      id: newId,
      selectedUserId: '',
      selectedExerciseId: '',
      distance: '',
      duration: '',
      maxHr: '',
      restingHr1min: '',
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
    const maxHr = form.maxHr ? parseInt(form.maxHr) : null;
    const restingHr1min = form.restingHr1min ? parseInt(form.restingHr1min) : null;

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
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'MAS Test - Καταγραφή Προόδου'
        } as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const mas = dist / (dur * 60);
      const masKmh = mas * 3.6;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          exercise_id: form.selectedExerciseId,
          mas_meters: dist,
          mas_minutes: dur,
          mas_ms: mas,
          mas_kmh: masKmh,
          max_hr: maxHr,
          resting_hr_1min: restingHr1min
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Το MAS Test αποθηκεύτηκε"
      });

      updateForm(formId, {
        distance: '',
        duration: '',
        maxHr: '',
        restingHr1min: '',
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

  // ============ Cardiac Forms ============
  const addNewCardiacForm = () => {
    const newId = (Math.max(...cardiacForms.map(f => parseInt(f.id))) + 1).toString();
    setCardiacForms([...cardiacForms, {
      id: newId,
      selectedUserId: '',
      maxHr: '',
      restingHr1min: '',
      loading: false
    }]);
  };

  const removeCardiacForm = (formId: string) => {
    if (cardiacForms.length > 1) {
      setCardiacForms(cardiacForms.filter(f => f.id !== formId));
    }
  };

  const updateCardiacForm = (formId: string, updates: Partial<CardiacForm>) => {
    setCardiacForms(prevForms => prevForms.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const handleCardiacSave = async (formId: string) => {
    const form = cardiacForms.find(f => f.id === formId);
    if (!form) return;

    if (!form.selectedUserId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη",
        variant: "destructive"
      });
      return;
    }

    const maxHr = form.maxHr ? parseInt(form.maxHr) : null;
    const restingHr1min = form.restingHr1min ? parseInt(form.restingHr1min) : null;

    if (!maxHr && !restingHr1min) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε τουλάχιστον ένα πεδίο",
        variant: "destructive"
      });
      return;
    }

    updateCardiacForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Cardiac Data - Καταγραφή Προόδου'
        } as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          max_hr: maxHr,
          resting_hr_1min: restingHr1min
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Τα Cardiac Data αποθηκεύτηκαν"
      });

      updateCardiacForm(formId, {
        maxHr: '',
        restingHr1min: '',
        loading: false
      });
      
      if (onRecordSaved) {
        onRecordSaved();
      }
    } catch (error) {
      console.error('Error saving cardiac data:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
      updateCardiacForm(formId, { loading: false });
    }
  };

  // ============ VO2 Max Forms ============
  const addNewVo2MaxForm = () => {
    const newId = (Math.max(...vo2MaxForms.map(f => parseInt(f.id))) + 1).toString();
    setVo2MaxForms([...vo2MaxForms, {
      id: newId,
      selectedUserId: '',
      vo2Max: '',
      loading: false
    }]);
  };

  const removeVo2MaxForm = (formId: string) => {
    if (vo2MaxForms.length > 1) {
      setVo2MaxForms(vo2MaxForms.filter(f => f.id !== formId));
    }
  };

  const updateVo2MaxForm = (formId: string, updates: Partial<Vo2MaxForm>) => {
    setVo2MaxForms(prevForms => prevForms.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const handleVo2MaxSave = async (formId: string) => {
    const form = vo2MaxForms.find(f => f.id === formId);
    if (!form) return;

    if (!form.selectedUserId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη",
        variant: "destructive"
      });
      return;
    }

    const vo2Max = form.vo2Max ? parseFloat(form.vo2Max) : null;

    if (!vo2Max) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε την τιμή VO2 Max",
        variant: "destructive"
      });
      return;
    }

    updateVo2MaxForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'VO2 Max - Καταγραφή Προόδου'
        } as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          vo2_max: vo2Max
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Το VO2 Max αποθηκεύτηκε"
      });

      updateVo2MaxForm(formId, {
        vo2Max: '',
        loading: false
      });
      
      if (onRecordSaved) {
        onRecordSaved();
      }
    } catch (error) {
      console.error('Error saving VO2 Max:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
      updateVo2MaxForm(formId, { loading: false });
    }
  };

  // ============ Bodyweight Forms ============
  const addNewBodyweightForm = () => {
    const newId = (Math.max(...bodyweightForms.map(f => parseInt(f.id))) + 1).toString();
    setBodyweightForms([...bodyweightForms, {
      id: newId,
      selectedUserId: '',
      pushUps: '',
      pullUps: '',
      t2b: '',
      loading: false
    }]);
  };

  const removeBodyweightForm = (formId: string) => {
    if (bodyweightForms.length > 1) {
      setBodyweightForms(bodyweightForms.filter(f => f.id !== formId));
    }
  };

  const updateBodyweightForm = (formId: string, updates: Partial<BodyweightForm>) => {
    setBodyweightForms(prevForms => prevForms.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const handleBodyweightSave = async (formId: string) => {
    const form = bodyweightForms.find(f => f.id === formId);
    if (!form) return;

    if (!form.selectedUserId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη",
        variant: "destructive"
      });
      return;
    }

    if (!form.pushUps && !form.pullUps && !form.t2b) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε τουλάχιστον ένα πεδίο",
        variant: "destructive"
      });
      return;
    }

    updateBodyweightForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Bodyweight Test - Καταγραφή Προόδου'
        } as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          push_ups: form.pushUps ? parseInt(form.pushUps) : null,
          pull_ups: form.pullUps ? parseInt(form.pullUps) : null,
          t2b: form.t2b ? parseInt(form.t2b) : null
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Το Bodyweight Test αποθηκεύτηκε"
      });

      updateBodyweightForm(formId, {
        pushUps: '',
        pullUps: '',
        t2b: '',
        loading: false
      });
      
      if (onRecordSaved) {
        onRecordSaved();
      }
    } catch (error) {
      console.error('Error saving bodyweight test:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
      updateBodyweightForm(formId, { loading: false });
    }
  };

  // ============ Farmer Forms ============
  const addNewFarmerForm = () => {
    const newId = (Math.max(...farmerForms.map(f => parseInt(f.id))) + 1).toString();
    setFarmerForms([...farmerForms, {
      id: newId,
      selectedUserId: '',
      farmerKg: '',
      farmerMeters: '',
      farmerSeconds: '',
      loading: false
    }]);
  };

  const removeFarmerForm = (formId: string) => {
    if (farmerForms.length > 1) {
      setFarmerForms(farmerForms.filter(f => f.id !== formId));
    }
  };

  const updateFarmerForm = (formId: string, updates: Partial<FarmerForm>) => {
    setFarmerForms(prevForms => prevForms.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const handleFarmerSave = async (formId: string) => {
    const form = farmerForms.find(f => f.id === formId);
    if (!form) return;

    if (!form.selectedUserId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη",
        variant: "destructive"
      });
      return;
    }

    if (!form.farmerKg && !form.farmerMeters && !form.farmerSeconds) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε τουλάχιστον ένα πεδίο",
        variant: "destructive"
      });
      return;
    }

    updateFarmerForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Farmer Test - Καταγραφή Προόδου'
        } as any)
        .select()
        .single();

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

      toast({
        title: "Επιτυχία",
        description: "Το Farmer Test αποθηκεύτηκε"
      });

      updateFarmerForm(formId, {
        farmerKg: '',
        farmerMeters: '',
        farmerSeconds: '',
        loading: false
      });
      
      if (onRecordSaved) {
        onRecordSaved();
      }
    } catch (error) {
      console.error('Error saving farmer test:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
      updateFarmerForm(formId, { loading: false });
    }
  };

  // ============ Sprint Forms ============
  const addNewSprintForm = () => {
    const newId = (Math.max(...sprintForms.map(f => parseInt(f.id))) + 1).toString();
    setSprintForms([...sprintForms, {
      id: newId,
      selectedUserId: '',
      sprintSeconds: '',
      sprintMeters: '',
      sprintResistance: '',
      sprintKmh: '',
      sprintExercise: 'track',
      loading: false
    }]);
  };

  const removeSprintForm = (formId: string) => {
    if (sprintForms.length > 1) {
      setSprintForms(sprintForms.filter(f => f.id !== formId));
    }
  };

  const updateSprintForm = (formId: string, updates: Partial<SprintForm>) => {
    setSprintForms(prevForms => prevForms.map(f => f.id === formId ? { ...f, ...updates } : f));
  };

  const handleSprintSave = async (formId: string) => {
    const form = sprintForms.find(f => f.id === formId);
    if (!form) return;

    if (!form.selectedUserId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε χρήστη",
        variant: "destructive"
      });
      return;
    }

    const seconds = parseFloat(form.sprintSeconds);
    if (!seconds || seconds <= 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε τον χρόνο",
        variant: "destructive"
      });
      return;
    }

    updateSprintForm(formId, { loading: true });
    try {
      const { data: session, error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .insert({
          coach_id: coachId,
          user_id: form.selectedUserId,
          test_date: new Date().toISOString().split('T')[0],
          notes: 'Sprint Test - Καταγραφή Προόδου'
        } as any)
        .select()
        .single();

      if (sessionError) throw sessionError;

      const metrics = calculateSprintMetrics(form);
      
      // Αποθήκευση με exercise_id βάσει επιλογής Track/Woodway
      const TRACK_EXERCISE_ID = 'ad3656e1-f9f5-4c46-9e5a-116db0a73a87';
      const WOODWAY_EXERCISE_ID = 'e1f30a44-817f-4518-a7e4-a659a587f7a4';
      const sprintExerciseId = form.sprintExercise === 'woodway' ? WOODWAY_EXERCISE_ID : TRACK_EXERCISE_ID;
      
      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .insert({
          test_session_id: session.id,
          exercise_id: sprintExerciseId,
          sprint_seconds: seconds,
          sprint_meters: metrics.meters ? parseFloat(metrics.meters) : null,
          sprint_resistance: form.sprintResistance || null,
          sprint_watt: form.sprintKmh ? parseFloat(form.sprintKmh) : null
        });

      if (dataError) throw dataError;

      toast({
        title: "Επιτυχία",
        description: "Το Sprint Test αποθηκεύτηκε"
      });

      updateSprintForm(formId, {
        sprintSeconds: '',
        sprintMeters: '',
        sprintResistance: '',
        sprintKmh: '',
        loading: false
      });
      
      if (onRecordSaved) {
        onRecordSaved();
      }
    } catch (error) {
      console.error('Error saving sprint test:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης",
        variant: "destructive"
      });
      updateSprintForm(formId, { loading: false });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-[1px] overflow-x-auto pb-2 sticky bottom-0 bg-background z-10 -ml-4 pl-4">
        {/* MAS Test Forms */}
      <div className="space-y-3">
        {forms.map((form, formIndex) => {
          const calculatedMas = calculateMas(form.distance, form.duration);

          return (
            <Card key={form.id} className="rounded-none w-[calc(66.666%+120px)]">
              <CardHeader className="pb-1 pt-2 px-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xs">MAS Test {forms.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                  <Button onClick={addNewForm} size="sm" className="rounded-none h-5 w-5 p-0 ml-auto">
                    <Plus className="w-3 h-3" />
                  </Button>
                  {forms.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeForm(form.id)}
                      className="rounded-none h-5 w-5 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2 space-y-2">
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
                      placeholder="min"
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
                      className="rounded-none h-7 w-7 p-0"
                      disabled={form.loading}
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cardiac Data Card */}
      <div className="space-y-3">
        {cardiacForms.map((form, formIndex) => (
          <Card key={form.id} className="rounded-none w-fit">
            <CardHeader className="pb-1 pt-2 px-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs">Cardiac Data {cardiacForms.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                <Button onClick={addNewCardiacForm} size="sm" className="rounded-none h-5 w-5 p-0 ml-auto">
                  <Plus className="w-3 h-3" />
                </Button>
                {cardiacForms.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCardiacForm(form.id)}
                    className="rounded-none h-5 w-5 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
              <div className="w-40">
                <Label className="text-xs">Ασκούμενος</Label>
                <Combobox
                  options={userOptions}
                  value={form.selectedUserId}
                  onValueChange={(val) => updateCardiacForm(form.id, { selectedUserId: val })}
                  placeholder="Χρήστης"
                  emptyMessage="Δεν βρέθηκε."
                  className="h-7 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <div className="w-20">
                  <Label className="text-xs">Max HR</Label>
                  <Input
                    type="number"
                    placeholder="bpm"
                    value={form.maxHr}
                    onChange={(e) => updateCardiacForm(form.id, { maxHr: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="w-20">
                  <Label className="text-xs whitespace-nowrap">1min Rest</Label>
                  <Input
                    type="number"
                    placeholder="bpm"
                    value={form.restingHr1min}
                    onChange={(e) => updateCardiacForm(form.id, { restingHr1min: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => handleCardiacSave(form.id)} 
                    className="rounded-none h-7 w-7 p-0"
                    disabled={form.loading}
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* VO2 Max Card */}
      <div className="space-y-3">
        {vo2MaxForms.map((form, formIndex) => (
          <Card key={form.id} className="rounded-none w-fit">
            <CardHeader className="pb-1 pt-2 px-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs">VO2 Max {vo2MaxForms.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                <Button onClick={addNewVo2MaxForm} size="sm" className="rounded-none h-5 w-5 p-0 ml-auto">
                  <Plus className="w-3 h-3" />
                </Button>
                {vo2MaxForms.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeVo2MaxForm(form.id)}
                    className="rounded-none h-5 w-5 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
              <div className="w-40">
                <Label className="text-xs">Ασκούμενος</Label>
                <Combobox
                  options={userOptions}
                  value={form.selectedUserId}
                  onValueChange={(val) => updateVo2MaxForm(form.id, { selectedUserId: val })}
                  placeholder="Χρήστης"
                  emptyMessage="Δεν βρέθηκε."
                  className="h-7 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <div className="w-24">
                  <Label className="text-xs">VO2 Max</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="ml/kg/min"
                    value={form.vo2Max}
                    onChange={(e) => updateVo2MaxForm(form.id, { vo2Max: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => handleVo2MaxSave(form.id)} 
                    className="rounded-none h-7 w-7 p-0"
                    disabled={form.loading}
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bodyweight Forms */}
      <div className="space-y-3">
        {bodyweightForms.map((form, formIndex) => (
          <Card key={form.id} className="rounded-none w-fit">
            <CardHeader className="pb-1 pt-2 px-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs">Push Ups, Pull Ups & T2B {bodyweightForms.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                <Button onClick={addNewBodyweightForm} size="sm" className="rounded-none h-5 w-5 p-0 ml-auto">
                  <Plus className="w-3 h-3" />
                </Button>
                {bodyweightForms.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeBodyweightForm(form.id)}
                    className="rounded-none h-5 w-5 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
              <div className="w-32">
                <Label className="text-xs">Ασκούμενος</Label>
                <Combobox
                  options={userOptions}
                  value={form.selectedUserId}
                  onValueChange={(val) => updateBodyweightForm(form.id, { selectedUserId: val })}
                  placeholder="Χρήστης"
                  emptyMessage="Δεν βρέθηκε."
                  className="h-7 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <div className="w-16">
                  <Label className="text-xs">Push Ups</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.pushUps}
                    onChange={(e) => updateBodyweightForm(form.id, { pushUps: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="w-16">
                  <Label className="text-xs">Pull Ups</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.pullUps}
                    onChange={(e) => updateBodyweightForm(form.id, { pullUps: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="w-16">
                  <Label className="text-xs">T2B</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.t2b}
                    onChange={(e) => updateBodyweightForm(form.id, { t2b: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => handleBodyweightSave(form.id)} 
                    className="rounded-none h-7 w-7 p-0"
                    disabled={form.loading}
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Farmer Forms */}
      <div className="space-y-3">
        {farmerForms.map((form, formIndex) => (
          <Card key={form.id} className="rounded-none w-fit">
            <CardHeader className="pb-1 pt-2 px-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs">Farmer {farmerForms.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                <Button onClick={addNewFarmerForm} size="sm" className="rounded-none h-5 w-5 p-0 ml-auto">
                  <Plus className="w-3 h-3" />
                </Button>
                {farmerForms.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFarmerForm(form.id)}
                    className="rounded-none h-5 w-5 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
              <div className="w-32">
                <Label className="text-xs">Ασκούμενος</Label>
                <Combobox
                  options={userOptions}
                  value={form.selectedUserId}
                  onValueChange={(val) => updateFarmerForm(form.id, { selectedUserId: val })}
                  placeholder="Χρήστης"
                  emptyMessage="Δεν βρέθηκε."
                  className="h-7 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <div className="w-16">
                  <Label className="text-xs">Kg</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="kg"
                    value={form.farmerKg}
                    onChange={(e) => updateFarmerForm(form.id, { farmerKg: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="w-16">
                  <Label className="text-xs">Μέτρα</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="m"
                    value={form.farmerMeters}
                    onChange={(e) => updateFarmerForm(form.id, { farmerMeters: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="w-16">
                  <Label className="text-xs">Δευτ.</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="s"
                    value={form.farmerSeconds}
                    onChange={(e) => updateFarmerForm(form.id, { farmerSeconds: e.target.value })}
                    className="rounded-none no-spinners h-7 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => handleFarmerSave(form.id)} 
                    className="rounded-none h-7 w-7 p-0"
                    disabled={form.loading}
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sprint Forms */}
      <div className="space-y-3">
        {sprintForms.map((form, formIndex) => {
          const sprintMetrics = calculateSprintMetrics(form);
          
          return (
            <Card key={form.id} className="rounded-none w-fit">
              <CardHeader className="pb-1 pt-2 px-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xs">Sprint {sprintForms.length > 1 ? `#${formIndex + 1}` : ''}</CardTitle>
                  <Button onClick={addNewSprintForm} size="sm" className="rounded-none h-5 w-5 p-0 ml-auto">
                    <Plus className="w-3 h-3" />
                  </Button>
                  {sprintForms.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSprintForm(form.id)}
                      className="rounded-none h-5 w-5 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2 space-y-2">
                <div className="w-32">
                  <Label className="text-xs">Ασκούμενος</Label>
                  <Combobox
                    options={userOptions}
                    value={form.selectedUserId}
                    onValueChange={(val) => updateSprintForm(form.id, { selectedUserId: val })}
                    placeholder="Χρήστης"
                    emptyMessage="Δεν βρέθηκε."
                    className="h-7 text-xs"
                  />
                </div>

                <div className="w-32">
                  <Select 
                    value={form.sprintExercise} 
                    onValueChange={(val) => updateSprintForm(form.id, { sprintExercise: val })}
                  >
                    <SelectTrigger className="rounded-none h-7 text-xs">
                      <SelectValue placeholder="Τύπος" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="track">Track</SelectItem>
                      <SelectItem value="woodway">Woodway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <div className="w-16">
                    <Label className="text-xs">Δευτ.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="s"
                      value={form.sprintSeconds}
                      onChange={(e) => updateSprintForm(form.id, { sprintSeconds: e.target.value })}
                      className="rounded-none no-spinners h-7 text-xs"
                    />
                  </div>

                  {form.sprintExercise === 'track' ? (
                    <>
                      <div className="w-16">
                        <Label className="text-xs">Μέτρα</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="m"
                          value={form.sprintMeters}
                          onChange={(e) => updateSprintForm(form.id, { sprintMeters: e.target.value })}
                          className="rounded-none no-spinners h-7 text-xs"
                        />
                      </div>
                      <div className="w-16">
                        <Label className="text-xs">Km/h</Label>
                        <Input
                          type="text"
                          value={sprintMetrics.kmh}
                          readOnly
                          placeholder="--"
                          className="rounded-none bg-gray-100 h-7 text-xs"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16">
                        <Label className="text-xs">Km/h</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="km/h"
                          value={form.sprintKmh}
                          onChange={(e) => updateSprintForm(form.id, { sprintKmh: e.target.value })}
                          className="rounded-none no-spinners h-7 text-xs"
                        />
                      </div>
                      <div className="w-16">
                        <Label className="text-xs">Μέτρα</Label>
                        <Input
                          type="text"
                          value={sprintMetrics.meters}
                          readOnly
                          placeholder="--"
                          className="rounded-none bg-gray-100 h-7 text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Αντίσταση</Label>
                    <Input
                      type="text"
                      placeholder="%"
                      value={form.sprintResistance}
                      onChange={(e) => updateSprintForm(form.id, { sprintResistance: e.target.value })}
                      className="rounded-none h-7 text-xs"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={() => handleSprintSave(form.id)} 
                      className="rounded-none h-7 w-7 p-0"
                      disabled={form.loading}
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      </div>
    </div>
  );
};
