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
import { Dumbbell, Settings, AlertTriangle, Trash2, Plus, Search, Library, Play } from 'lucide-react';
import { ExerciseSelectionDialog } from '@/components/programs/builder/ExerciseSelectionDialog';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Phases in exact order from Weekly Planning (Εβδομαδιαίος Προγραμματισμός)
const PHASES_ORDER = [
  { value: 'corrective', label: 'Corrective', color: 'bg-red-500' },
  { value: 'stabilization', label: 'Stabilization Training', color: 'bg-orange-500' },
  { value: 'connecting-linking', label: 'Connecting Linking', color: 'bg-yellow-500' },
  { value: 'movement-skills', label: 'Movement Skills', color: 'bg-amber-500' },
  { value: 'non-functional-hypertrophy', label: 'Non-Functional Hypertrophy', color: 'bg-lime-500' },
  { value: 'functional-hypertrophy', label: 'Functional Hypertrophy', color: 'bg-green-500' },
  { value: 'starting-strength', label: 'Starting Strength', color: 'bg-teal-400' },
  { value: 'explosive-strength', label: 'Explosive Strength', color: 'bg-teal-500' },
  { value: 'reactive-strength', label: 'Reactive Strength', color: 'bg-teal-600' },
  { value: 'str-spd', label: 'Strength/Speed', color: 'bg-blue-400' },
  { value: 'pwr', label: 'Power', color: 'bg-blue-500' },
  { value: 'spd-str', label: 'Speed/Strength', color: 'bg-blue-600' },
  { value: 'spd', label: 'Speed', color: 'bg-blue-700' },
  { value: 'str-end', label: 'Strength Endurance', color: 'bg-purple-400' },
  { value: 'pwr-end', label: 'Power Endurance', color: 'bg-purple-500' },
  { value: 'spd-end', label: 'Speed Endurance', color: 'bg-purple-600' },
  { value: 'aero-end', label: 'Aerobic Endurance', color: 'bg-purple-700' },
  { value: 'competition', label: 'Competition', color: 'bg-pink-500' },
];

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
    phaseCategories,
    correctiveIssues,
    correctiveMuscles,
    loading,
    addRepScheme,
    deleteRepScheme,
    addPhaseExercise,
    removePhaseExercise,
    addPhaseCategory,
    removePhaseCategory,
    addCorrectiveIssue,
    removeCorrectiveIssue,
    addCorrectiveMuscle,
    removeCorrectiveMuscle,
  } = useTrainingPhaseConfig();

  const { exercises } = useExercises();
  const [muscles, setMuscles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [searchExercise, setSearchExercise] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedAction, setSelectedAction] = useState<'stretch' | 'strengthen'>('stretch');
  const [exerciseLibraryOpen, setExerciseLibraryOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedExerciseForVideo, setSelectedExerciseForVideo] = useState<any>(null);

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

  // Load categories
  React.useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from('exercise_categories')
        .select('*')
        .order('type')
        .order('name');
      setCategories(data || []);
    };
    loadCategories();
  }, []);

  // Sort phases by PHASES_ORDER
  const orderedPhases = useMemo(() => {
    return [...phases].sort((a, b) => {
      const indexA = PHASES_ORDER.findIndex(p => p.value === a.phase_key);
      const indexB = PHASES_ORDER.findIndex(p => p.value === b.phase_key);
      // If not found in order, put at end
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });
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

  const currentPhaseCategories = useMemo(() =>
    phaseCategories.filter(c => c.phase_id === selectedPhase),
    [phaseCategories, selectedPhase]
  );

  // Group categories by type
  const categoriesByType = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    categories.forEach(cat => {
      const type = cat.type || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(cat);
    });
    return grouped;
  }, [categories]);

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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
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
                  <SelectContent className="max-h-80 bg-background">
                    <ScrollArea className="h-80">
                      {PHASES_ORDER.map(phaseConfig => {
                        const dbPhase = phases.find(p => p.phase_key === phaseConfig.value);
                        
                        return (
                          <SelectItem 
                            key={phaseConfig.value} 
                            value={dbPhase?.id || phaseConfig.value}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${phaseConfig.color}`} />
                              <span>{phaseConfig.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
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
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Ασκήσεις Φάσης</span>
                  {selectedPhase && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExerciseLibraryOpen(true)}
                      className="rounded-none h-7 text-xs"
                    >
                      <Library className="w-3 h-3 mr-1" />
                      Τράπεζα Ασκήσεων
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPhase && (
                  <>
                    {/* Current exercises */}
                    <ScrollArea className="h-40">
                      <div className="space-y-1">
                        {currentPhaseExercises.map(pe => {
                          const videoUrl = pe.exercises?.video_url;
                          const hasVideo = videoUrl && isValidVideoUrl(videoUrl);
                          const thumbnailUrl = hasVideo ? getVideoThumbnail(videoUrl) : null;
                          
                          return (
                            <div key={pe.id} className="flex items-center justify-between p-2 bg-gray-50 border text-sm">
                              <div className="flex items-center gap-2">
                                {/* Video Thumbnail */}
                                {thumbnailUrl ? (
                                  <div 
                                    className="relative w-10 h-8 flex-shrink-0 cursor-pointer"
                                    onClick={() => {
                                      setSelectedExerciseForVideo(pe);
                                      setVideoDialogOpen(true);
                                    }}
                                  >
                                    <img 
                                      src={thumbnailUrl}
                                      alt={pe.exercises?.name}
                                      className="w-full h-full object-cover rounded-sm"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors">
                                      <Play className="w-3 h-3 text-white fill-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-10 h-8 bg-gray-200 flex items-center justify-center rounded-sm flex-shrink-0">
                                    <Dumbbell className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <span className="truncate">{pe.exercises?.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePhaseExercise(pe.id)}
                                className="h-6 w-6 text-red-500 hover:text-red-700 flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
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

            {/* Phase Categories */}
            <Card className="rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Κατηγορίες Ασκήσεων</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPhase && (
                  <>
                    {/* Current categories */}
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {currentPhaseCategories.map(pc => (
                          <div key={pc.id} className="flex items-center justify-between p-2 bg-gray-50 border text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-none text-xs">
                                {pc.exercise_categories?.type}
                              </Badge>
                              <span>{pc.exercise_categories?.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePhaseCategory(pc.id)}
                              className="h-6 w-6 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Add categories by type */}
                    <div className="space-y-2 border-t pt-2">
                      <span className="text-xs text-gray-500">Προσθήκη κατηγορίας:</span>
                      <ScrollArea className="h-40">
                        <div className="space-y-2">
                          {Object.entries(categoriesByType).map(([type, cats]) => (
                            <div key={type} className="space-y-1">
                              <span className="text-xs font-medium text-gray-600 uppercase">{type}</span>
                              <div className="flex flex-wrap gap-1">
                                {cats.map((cat: any) => (
                                  <Button
                                    key={cat.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPhaseCategory(selectedPhase, cat.id)}
                                    disabled={currentPhaseCategories.some(pc => pc.category_id === cat.id)}
                                    className="rounded-none text-xs h-7"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    {cat.name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Exercise Selection Dialog */}
            <ExerciseSelectionDialog
              open={exerciseLibraryOpen}
              onOpenChange={setExerciseLibraryOpen}
              exercises={exercises}
              onSelectExercise={(exerciseId) => {
                handleAddExercise(exerciseId);
                setExerciseLibraryOpen(false);
              }}
            />

            {/* Video Dialog */}
            <ExerciseVideoDialog
              isOpen={videoDialogOpen}
              onClose={() => {
                setVideoDialogOpen(false);
                setSelectedExerciseForVideo(null);
              }}
              exercise={selectedExerciseForVideo}
            />
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
