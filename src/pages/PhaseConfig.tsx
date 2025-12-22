import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTrainingPhaseConfig, TrainingPhase, PhaseRepScheme } from '@/hooks/useTrainingPhaseConfig';
import { useExercises } from '@/hooks/useExercises';
import { Dumbbell, Settings, AlertTriangle, Trash2, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Phases matching AnnualPlanning structure
const PHASES_CONFIG = [
  { value: 'corrective', label: 'Corrective', shortLabel: 'COR', color: 'bg-red-500', category: 'Ετήσιος Προγραμματισμός' },
  { value: 'stabilization', label: 'Stabilization Training', shortLabel: 'STB', color: 'bg-orange-500', category: 'Ετήσιος Προγραμματισμός' },
  { value: 'connecting-linking', label: 'Connecting Linking', shortLabel: 'CL', color: 'bg-yellow-500', category: 'Ετήσιος Προγραμματισμός' },
  { value: 'movement-skills', label: 'Movement Skills', shortLabel: 'MS', color: 'bg-amber-500', category: 'Ετήσιος Προγραμματισμός' },
  { value: 'non-functional-hypertrophy', label: 'Non-Functional Hypertrophy', shortLabel: 'NFH', color: 'bg-lime-500', category: 'Μηνιαίος Προγραμματισμός' },
  { value: 'functional-hypertrophy', label: 'Functional Hypertrophy', shortLabel: 'FH', color: 'bg-green-500', category: 'Μηνιαίος Προγραμματισμός' },
  { value: 'maximal-strength', label: 'Maximal Strength Training', shortLabel: 'MAX', color: 'bg-teal-500', category: 'Μηνιαίος Προγραμματισμός' },
  { value: 'power', label: 'Power Training', shortLabel: 'PWR', color: 'bg-blue-500', category: 'Μηνιαίος Προγραμματισμός' },
  { value: 'endurance', label: 'Endurance', shortLabel: 'END', color: 'bg-purple-500', category: 'Μηνιαίος Προγραμματισμός' },
  { value: 'competition', label: 'Competition', shortLabel: 'COMP', color: 'bg-pink-500', category: 'Ετήσιος Προγραμματισμός' },
];

// Sub-phases for weekly planning (Εβδομαδιαίος Προγραμματισμός)
const SUB_PHASES_CONFIG = {
  'maximal-strength': [
    { value: 'starting-strength', label: 'Starting Strength', shortLabel: 'START', color: 'bg-teal-400' },
    { value: 'explosive-strength', label: 'Explosive Strength', shortLabel: 'EXPL', color: 'bg-teal-500' },
    { value: 'reactive-strength', label: 'Reactive Strength', shortLabel: 'REACT', color: 'bg-teal-600' },
  ],
  'power': [
    { value: 'str-spd', label: 'Strength/Speed', shortLabel: 'STR/SPD', color: 'bg-blue-400' },
    { value: 'pwr', label: 'Power', shortLabel: 'PWR', color: 'bg-blue-500' },
    { value: 'spd-str', label: 'Speed/Strength', shortLabel: 'SPD/STR', color: 'bg-blue-600' },
    { value: 'spd', label: 'Speed', shortLabel: 'SPD', color: 'bg-blue-700' },
  ],
  'endurance': [
    { value: 'str-end', label: 'Strength Endurance', shortLabel: 'STR/END', color: 'bg-purple-400' },
    { value: 'pwr-end', label: 'Power Endurance', shortLabel: 'PWR/END', color: 'bg-purple-500' },
    { value: 'spd-end', label: 'Speed Endurance', shortLabel: 'SPD/END', color: 'bg-purple-600' },
    { value: 'aero-end', label: 'Aerobic Endurance', shortLabel: 'AERO/END', color: 'bg-purple-700' },
  ],
};

// Functional test issues
const FUNCTIONAL_ISSUES = [
  { name: 'knee_valgus', label: 'Knee Valgus', category: 'squat' },
  { name: 'hip_shift', label: 'Hip Shift', category: 'squat' },
  { name: 'forward_lean', label: 'Forward Lean', category: 'squat' },
  { name: 'heel_rise', label: 'Heel Rise', category: 'squat' },
  { name: 'arms_fall', label: 'Arms Fall Forward', category: 'squat' },
  { name: 'trunk_rotation', label: 'Trunk Rotation', category: 'single_leg' },
  { name: 'knee_valgus_single', label: 'Knee Valgus (Single Leg)', category: 'single_leg' },
  { name: 'hip_drop', label: 'Hip Drop', category: 'single_leg' },
  { name: 'forward_head', label: 'Forward Head', category: 'posture' },
  { name: 'rounded_shoulders', label: 'Rounded Shoulders', category: 'posture' },
  { name: 'lordosis', label: 'Lordosis', category: 'posture' },
  { name: 'kyphosis', label: 'Kyphosis', category: 'posture' },
  { name: 'scoliosis', label: 'Scoliosis', category: 'posture' },
];

const PhaseConfig: React.FC = () => {
  const {
    phases,
    repSchemes,
    phaseExercises,
    correctiveIssues,
    correctiveMuscles,
    loading,
    addRepScheme,
    deleteRepScheme,
    addPhaseExercise,
    removePhaseExercise,
    addCorrectiveIssue,
    removeCorrectiveIssue,
    addCorrectiveMuscle,
    removeCorrectiveMuscle,
  } = useTrainingPhaseConfig();

  const { exercises } = useExercises();
  const [muscles, setMuscles] = useState<any[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [searchExercise, setSearchExercise] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedAction, setSelectedAction] = useState<'stretch' | 'strengthen'>('stretch');

  // New rep scheme form state
  const [newScheme, setNewScheme] = useState({
    scheme_name: '',
    sets: 3,
    reps: '8',
    tempo: '',
    rest: '60sec',
    intensity_percent: 70,
    is_primary: false,
  });

  // Load muscles
  React.useEffect(() => {
    const loadMuscles = async () => {
      const { data } = await supabase
        .from('muscles')
        .select('*')
        .order('name');
      setMuscles(data || []);
    };
    loadMuscles();
  }, []);

  // Group phases by category from PHASES_CONFIG
  const groupedPhases = useMemo(() => {
    const groups: Record<string, TrainingPhase[]> = {
      'Ετήσιος Προγραμματισμός': [],
      'Μηνιαίος Προγραμματισμός': [],
      'Εβδομαδιαίος Προγραμματισμός - Strength': [],
      'Εβδομαδιαίος Προγραμματισμός - Power': [],
      'Εβδομαδιαίος Προγραμματισμός - Endurance': [],
    };
    
    phases.forEach(phase => {
      // Check if it's a main phase from PHASES_CONFIG
      const configPhase = PHASES_CONFIG.find(p => p.value === phase.phase_key);
      if (configPhase) {
        groups[configPhase.category].push(phase);
        return;
      }
      
      // Check if it's a sub-phase
      for (const [parentKey, subPhases] of Object.entries(SUB_PHASES_CONFIG)) {
        const subPhase = subPhases.find(sp => sp.value === phase.phase_key);
        if (subPhase) {
          if (parentKey === 'maximal-strength') {
            groups['Εβδομαδιαίος Προγραμματισμός - Strength'].push(phase);
          } else if (parentKey === 'power') {
            groups['Εβδομαδιαίος Προγραμματισμός - Power'].push(phase);
          } else if (parentKey === 'endurance') {
            groups['Εβδομαδιαίος Προγραμματισμός - Endurance'].push(phase);
          }
          return;
        }
      }
    });
    
    return groups;
  }, [phases]);

  const mainPhases = useMemo(() => phases.filter(p => p.phase_type === 'main'), [phases]);
  const subPhases = useMemo(() => phases.filter(p => p.phase_type === 'sub'), [phases]);

  const currentPhase = useMemo(() => 
    phases.find(p => p.id === selectedPhase), 
    [phases, selectedPhase]
  );

  const currentRepSchemes = useMemo(() => 
    repSchemes.filter(s => s.phase_id === selectedPhase),
    [repSchemes, selectedPhase]
  );

  const currentPhaseExercises = useMemo(() =>
    phaseExercises.filter(e => e.phase_id === selectedPhase),
    [phaseExercises, selectedPhase]
  );

  const filteredExercises = useMemo(() => {
    if (!searchExercise) return exercises.slice(0, 20);
    const search = searchExercise.toLowerCase();
    return exercises.filter(e => 
      e.name.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [exercises, searchExercise]);

  const handleAddScheme = async () => {
    if (!selectedPhase || !newScheme.scheme_name) return;
    await addRepScheme({
      phase_id: selectedPhase,
      ...newScheme,
      notes: null,
    });
    setNewScheme({
      scheme_name: '',
      sets: 3,
      reps: '8',
      tempo: '',
      rest: '60sec',
      intensity_percent: 70,
      is_primary: false,
    });
  };

  const handleAddExercise = async (exerciseId: string) => {
    if (!selectedPhase) return;
    await addPhaseExercise(selectedPhase, exerciseId);
  };

  const handleAddCorrectiveIssue = async (exerciseId: string) => {
    if (!selectedIssue) return;
    const issue = FUNCTIONAL_ISSUES.find(i => i.name === selectedIssue);
    if (!issue) return;
    
    await addCorrectiveIssue({
      issue_name: issue.name,
      issue_category: issue.category,
      exercise_id: exerciseId,
      exercise_type: 'corrective',
      priority: 1,
      notes: null,
    });
  };

  const handleAddCorrectiveMuscle = async (exerciseId: string) => {
    if (!selectedMuscle) return;
    await addCorrectiveMuscle({
      muscle_id: selectedMuscle,
      action_type: selectedAction,
      exercise_id: exerciseId,
      priority: 1,
      notes: null,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-[#cb8954] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ρύθμιση Φάσεων Προπόνησης</h1>
        <Badge variant="outline" className="rounded-none">
          {phases.length} Φάσεις
        </Badge>
      </div>

      <Tabs defaultValue="phases" className="w-full">
        <TabsList className="rounded-none">
          <TabsTrigger value="phases" className="rounded-none">
            <Settings className="w-4 h-4 mr-2" />
            Φάσεις & Ασκήσεις
          </TabsTrigger>
          <TabsTrigger value="corrective" className="rounded-none">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Corrective Exercises
          </TabsTrigger>
        </TabsList>

        {/* Phases & Exercises Tab */}
        <TabsContent value="phases" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Phase Selection */}
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Επιλογή Φάσης</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επέλεξε φάση..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <ScrollArea className="h-72">
                      {Object.entries(groupedPhases).map(([category, categoryPhases]) => (
                        categoryPhases.length > 0 && (
                          <React.Fragment key={category}>
                            <div className="text-xs font-semibold px-2 py-1.5 text-gray-500 bg-muted/50 sticky top-0">
                              {category}
                            </div>
                            {categoryPhases.map(phase => {
                              const configPhase = PHASES_CONFIG.find(p => p.value === phase.phase_key);
                              const subPhaseConfig = Object.values(SUB_PHASES_CONFIG).flat().find(sp => sp.value === phase.phase_key);
                              const color = configPhase?.color || subPhaseConfig?.color || 'bg-gray-400';
                              
                              return (
                                <SelectItem key={phase.id} value={phase.id} className="pl-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${color}`} />
                                    <span>{phase.phase_name}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </React.Fragment>
                        )
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>

                {currentPhase && (
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Επαναλήψεις:</span>
                      <span>{currentPhase.rep_range_min}-{currentPhase.rep_range_max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ένταση:</span>
                      <span>{currentPhase.intensity_range_min}-{currentPhase.intensity_range_max}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Διάλειμμα:</span>
                      <span>{currentPhase.rest_range_min}-{currentPhase.rest_range_max}s</span>
                    </div>
                    {currentPhase.description && (
                      <p className="text-gray-600 text-xs mt-2">{currentPhase.description}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rep Schemes */}
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rep Schemes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPhase && (
                  <>
                    {/* Current schemes */}
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {currentRepSchemes.map(scheme => (
                          <div key={scheme.id} className="flex items-center justify-between p-2 bg-gray-50 border">
                            <div>
                              <span className="font-medium">{scheme.scheme_name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {scheme.sets}x{scheme.reps} @ {scheme.intensity_percent}%
                              </span>
                              {scheme.is_primary && (
                                <Badge className="ml-2 bg-[#00ffba] text-black text-xs">Primary</Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRepScheme(scheme.id)}
                              className="h-6 w-6 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Add new scheme */}
                    <div className="space-y-2 border-t pt-2">
                      <Input
                        placeholder="Όνομα (π.χ. 5x5)"
                        value={newScheme.scheme_name}
                        onChange={e => setNewScheme({ ...newScheme, scheme_name: e.target.value })}
                        className="rounded-none text-sm"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="Sets"
                          value={newScheme.sets}
                          onChange={e => setNewScheme({ ...newScheme, sets: parseInt(e.target.value) || 0 })}
                          className="rounded-none text-sm"
                        />
                        <Input
                          placeholder="Reps"
                          value={newScheme.reps}
                          onChange={e => setNewScheme({ ...newScheme, reps: e.target.value })}
                          className="rounded-none text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="%1RM"
                          value={newScheme.intensity_percent}
                          onChange={e => setNewScheme({ ...newScheme, intensity_percent: parseInt(e.target.value) || 0 })}
                          className="rounded-none text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Tempo (π.χ. 3.1.1)"
                          value={newScheme.tempo}
                          onChange={e => setNewScheme({ ...newScheme, tempo: e.target.value })}
                          className="rounded-none text-sm"
                        />
                        <Input
                          placeholder="Rest (π.χ. 90sec)"
                          value={newScheme.rest}
                          onChange={e => setNewScheme({ ...newScheme, rest: e.target.value })}
                          className="rounded-none text-sm"
                        />
                      </div>
                      <Button
                        onClick={handleAddScheme}
                        disabled={!newScheme.scheme_name}
                        className="w-full rounded-none bg-[#cb8954] hover:bg-[#b87648]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Προσθήκη Scheme
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Phase Exercises */}
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ασκήσεις Φάσης</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPhase && (
                  <>
                    {/* Current exercises */}
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {currentPhaseExercises.map(pe => (
                          <div key={pe.id} className="flex items-center justify-between p-2 bg-gray-50 border text-sm">
                            <span>{pe.exercises?.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePhaseExercise(pe.id)}
                              className="h-6 w-6 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Search and add */}
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Αναζήτηση άσκησης..."
                        value={searchExercise}
                        onChange={e => setSearchExercise(e.target.value)}
                        className="rounded-none pl-8 text-sm"
                      />
                    </div>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {filteredExercises.map(ex => (
                          <Button
                            key={ex.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddExercise(ex.id)}
                            disabled={currentPhaseExercises.some(pe => pe.exercise_id === ex.id)}
                            className="w-full justify-start rounded-none text-sm h-8"
                          >
                            <Plus className="w-3 h-3 mr-2" />
                            {ex.name}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Corrective Exercises Tab */}
        <TabsContent value="corrective" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Issue-based correctives */}
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Functional Issues → Ασκήσεις
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedIssue} onValueChange={setSelectedIssue}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επέλεξε πρόβλημα..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      FUNCTIONAL_ISSUES.reduce((acc, issue) => {
                        if (!acc[issue.category]) acc[issue.category] = [];
                        acc[issue.category].push(issue);
                        return acc;
                      }, {} as Record<string, typeof FUNCTIONAL_ISSUES>)
                    ).map(([category, issues]) => (
                      <React.Fragment key={category}>
                        <div className="text-xs font-semibold px-2 py-1 text-gray-500 uppercase">{category}</div>
                        {issues.map(issue => (
                          <SelectItem key={issue.name} value={issue.name}>
                            {issue.label}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>

                {selectedIssue && (
                  <>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {correctiveIssues
                          .filter(ci => ci.issue_name === selectedIssue)
                          .map(ci => (
                            <div key={ci.id} className="flex items-center justify-between p-2 bg-gray-50 border text-sm">
                              <span>{ci.exercises?.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCorrectiveIssue(ci.id)}
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>

                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Αναζήτηση άσκησης..."
                        value={searchExercise}
                        onChange={e => setSearchExercise(e.target.value)}
                        className="rounded-none pl-8 text-sm"
                      />
                    </div>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {filteredExercises.map(ex => (
                          <Button
                            key={ex.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddCorrectiveIssue(ex.id)}
                            className="w-full justify-start rounded-none text-sm h-8"
                          >
                            <Plus className="w-3 h-3 mr-2" />
                            {ex.name}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Muscle-based correctives */}
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Μύες → Ασκήσεις (Stretch/Strengthen)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                    <SelectTrigger className="rounded-none flex-1">
                      <SelectValue placeholder="Επέλεξε μυ..." />
                    </SelectTrigger>
                    <SelectContent>
                      {muscles.map(muscle => (
                        <SelectItem key={muscle.id} value={muscle.id}>
                          {muscle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedAction} onValueChange={(v) => setSelectedAction(v as any)}>
                    <SelectTrigger className="rounded-none w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stretch">Stretch</SelectItem>
                      <SelectItem value="strengthen">Strengthen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedMuscle && (
                  <>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {correctiveMuscles
                          .filter(cm => cm.muscle_id === selectedMuscle && cm.action_type === selectedAction)
                          .map(cm => (
                            <div key={cm.id} className="flex items-center justify-between p-2 bg-gray-50 border text-sm">
                              <span>{cm.exercises?.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCorrectiveMuscle(cm.id)}
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>

                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Αναζήτηση άσκησης..."
                        value={searchExercise}
                        onChange={e => setSearchExercise(e.target.value)}
                        className="rounded-none pl-8 text-sm"
                      />
                    </div>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {filteredExercises.map(ex => (
                          <Button
                            key={ex.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddCorrectiveMuscle(ex.id)}
                            className="w-full justify-start rounded-none text-sm h-8"
                          >
                            <Plus className="w-3 h-3 mr-2" />
                            {ex.name}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhaseConfig;
