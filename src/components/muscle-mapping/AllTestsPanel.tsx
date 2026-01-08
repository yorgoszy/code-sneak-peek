import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowUp, MoveHorizontal, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SimpleExerciseSelectionDialog } from '@/components/programs/builder/SimpleExerciseSelectionDialog';
import { useExercises } from '@/hooks/useExercises';

interface Muscle {
  id: string;
  name: string;
  muscle_group: string | null;
}

interface Mapping {
  id: string;
  issue_category: string;
  issue_name: string;
  muscle_id: string;
  action_type: string;
  dysfunction: string | null;
  muscles?: Muscle;
}

// Posture options
const postureOptions = ['Κύφωση', 'Λόρδωση', 'Πρηνισμός', 'Σκολίωση'];

// Squat options - top (without Α/Δ)
const squatTopOptions = [
  'ΕΜΠΡΟΣ ΚΛΙΣΗ ΤΟΥ ΚΟΡΜΟΥ',
  'ΥΠΕΡΕΚΤΑΣΗ ΣΤΗΝ Σ.Σ.',
  'ΚΥΦΩΤΙΚΗ ΘΕΣΗ ΣΤΗ Σ.Σ.',
  'ΠΤΩΣΗ ΧΕΡΙΩΝ'
];

// Squat options - bottom (with Α/Δ)
const squatBottomOptions = [
  'ΠΡΗΝΙΣΜΟΣ ΠΕΛΜΑΤΩΝ',
  'ΕΣΩ ΣΤΡΟΦΗ ΓΟΝΑΤΩΝ',
  'ΕΞΩ ΣΤΡΟΦΗ ΓΟΝΑΤΩΝ',
  'ΑΝΥΨΩΣΗ ΦΤΕΡΝΩΝ',
  'ΜΕΤΑΦΟΡΑ ΒΑΡΟΥΣ'
];

// Single leg squat options
const singleLegSquatOptions = [
  'ΑΝΗΨΩΣΗ ΙΣΧΙΟΥ',
  'ΠΤΩΣΗ ΙΣΧΙΟΥ',
  'ΕΣΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ',
  'ΕΞΩ ΣΤΡΟΦΗ ΚΟΡΜΟΥ'
];

// FMS exercises - same order as FunctionalTests tab
const fmsRows = [
  ['Shoulder Mobility', 'Straight Leg Raise'],
  ['Trunk Stability Push-Up', 'Rotary Stability'],
  ['Inline Lunge', 'Deep Squat', 'Hurdle Step']
];

const hasLeftRight = ['Shoulder Mobility', 'Straight Leg Raise', 'Rotary Stability', 'Inline Lunge', 'Hurdle Step'];

// Risk level types for FMS
type RiskLevel = 'forbidden' | 'caution' | 'safe';

export const AllTestsPanel = () => {
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMusclesStrengthen, setSelectedMusclesStrengthen] = useState<string[]>([]);
  const [selectedMusclesStretch, setSelectedMusclesStretch] = useState<string[]>([]);
  const [muscleSearchStrengthen, setMuscleSearchStrengthen] = useState('');
  const [muscleSearchStretch, setMuscleSearchStretch] = useState('');
  
  // FMS Exercise Selection Dialog state
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [selectedFmsCell, setSelectedFmsCell] = useState<string>('');
  const { exercises, loadingExercises } = useExercises();
  
  // Store selected exercises for each FMS cell: { "Shoulder Mobility L forbidden": [{id, name}, ...], ... }
  const [fmsExercises, setFmsExercises] = useState<Record<string, Array<{id: string, name: string}>>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [musclesRes, mappingsRes] = await Promise.all([
      supabase.from('muscles').select('*').order('name'),
      supabase.from('functional_issue_muscle_mappings').select('*, muscles(*)')
    ]);

    if (musclesRes.data) setMuscles(musclesRes.data);
    if (mappingsRes.data) setMappings(mappingsRes.data as Mapping[]);
    
    setLoading(false);
  };

  const handleOpenDialog = (issue: string, category: string) => {
    setSelectedIssue(issue);
    setSelectedCategory(category);
    setSelectedMusclesStrengthen([]);
    setSelectedMusclesStretch([]);
    setMuscleSearchStrengthen('');
    setMuscleSearchStretch('');
    setDialogOpen(true);
  };

  // Handle FMS cell click - open exercise selection
  const handleFmsCellClick = (cellKey: string) => {
    setSelectedFmsCell(cellKey);
    setExerciseDialogOpen(true);
  };

  // Handle exercise selection for FMS
  const handleExerciseSelected = (exerciseId: string) => {
    const selectedExercise = exercises.find(e => e.id === exerciseId);
    if (!selectedExercise || !selectedFmsCell) return;
    
    // Add exercise to the FMS cell
    setFmsExercises(prev => {
      const currentExercises = prev[selectedFmsCell] || [];
      // Don't add if already exists
      if (currentExercises.some(e => e.id === exerciseId)) {
        toast.error('Η άσκηση υπάρχει ήδη');
        return prev;
      }
      return {
        ...prev,
        [selectedFmsCell]: [...currentExercises, { id: exerciseId, name: selectedExercise.name }]
      };
    });
    
    toast.success(`Άσκηση "${selectedExercise.name}" προστέθηκε`);
    setExerciseDialogOpen(false);
  };

  // Remove exercise from FMS cell
  const handleRemoveFmsExercise = (cellKey: string, exerciseId: string) => {
    setFmsExercises(prev => ({
      ...prev,
      [cellKey]: (prev[cellKey] || []).filter(e => e.id !== exerciseId)
    }));
  };

  // Check if FMS cell has exercises
  const hasFmsExercises = (cellKey: string) => {
    return (fmsExercises[cellKey] || []).length > 0;
  };

  const isMuscleAlreadyMapped = (muscleId: string, actionType: 'strengthen' | 'stretch') => {
    return mappings.some(m => 
      m.issue_name === selectedIssue && 
      m.issue_category === selectedCategory && 
      m.muscle_id === muscleId && 
      m.action_type === actionType
    );
  };

  const toggleMuscleSelection = (muscleId: string, actionType: 'strengthen' | 'stretch') => {
    if (isMuscleAlreadyMapped(muscleId, actionType)) return;
    
    if (actionType === 'strengthen') {
      setSelectedMusclesStrengthen(prev => 
        prev.includes(muscleId) 
          ? prev.filter(id => id !== muscleId)
          : [...prev, muscleId]
      );
    } else {
      setSelectedMusclesStretch(prev => 
        prev.includes(muscleId) 
          ? prev.filter(id => id !== muscleId)
          : [...prev, muscleId]
      );
    }
  };

  const handleAddMappings = async (actionType: 'strengthen' | 'stretch') => {
    const selectedMuscles = actionType === 'strengthen' ? selectedMusclesStrengthen : selectedMusclesStretch;
    
    if (selectedMuscles.length === 0) {
      toast.error('Επιλέξτε τουλάχιστον έναν μυ');
      return;
    }

    const insertData = selectedMuscles.map(muscleId => ({
      issue_category: selectedCategory,
      issue_name: selectedIssue,
      muscle_id: muscleId,
      action_type: actionType,
    }));

    const { error } = await supabase
      .from('functional_issue_muscle_mappings')
      .insert(insertData);

    if (error) {
      if (error.code === '23505') {
        toast.error('Κάποιες συνδέσεις υπάρχουν ήδη');
      } else {
        toast.error('Σφάλμα προσθήκης');
        console.error(error);
      }
    } else {
      toast.success(`${selectedMuscles.length} μύες προστέθηκαν`);
      if (actionType === 'strengthen') {
        setSelectedMusclesStrengthen([]);
      } else {
        setSelectedMusclesStretch([]);
      }
      fetchData();
    }
  };

  const handleDeleteMapping = async (id: string) => {
    const { error } = await supabase
      .from('functional_issue_muscle_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Σφάλμα διαγραφής');
    } else {
      toast.success('Η σύνδεση διαγράφηκε');
      fetchData();
    }
  };

  const hasMapping = (issue: string, category: string, actionType: string) => {
    return mappings.some(m => 
      m.issue_name === issue && 
      m.issue_category === category && 
      m.action_type === actionType
    );
  };

  const hasMappingAny = (issue: string, category: string) => {
    return hasMapping(issue, category, 'strengthen') || hasMapping(issue, category, 'stretch');
  };

  const getDialogMappings = () => {
    return mappings.filter(m => m.issue_name === selectedIssue && m.issue_category === selectedCategory);
  };

  const dialogMappings = getDialogMappings();
  const dialogStrengthen = dialogMappings.filter(m => m.action_type === 'strengthen');
  const dialogStretch = dialogMappings.filter(m => m.action_type === 'stretch');

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Στάση Σώματος + Μονοποδικά */}
        <div className="space-y-4">
          {/* Posture */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Στάση Σώματος</h3>
            <table className="w-full border-collapse text-xs">
              <tbody>
                {postureOptions.map((option) => (
                  <tr
                    key={option}
                    onClick={() => handleOpenDialog(option, 'posture')}
                    className={cn(
                      "cursor-pointer transition-colors",
                      hasMappingAny(option, 'posture')
                        ? "bg-black text-white"
                        : "bg-white hover:bg-gray-50"
                    )}
                  >
                    <td className="border border-gray-300 py-1.5 px-3 text-center">
                      {option}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Single Leg Squat */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Μονοποδικά Καθήματα</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-300 py-1.5 px-3 text-left font-semibold">Επιλογή</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Α</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Δ</th>
                </tr>
              </thead>
              <tbody>
                {singleLegSquatOptions.map((option) => (
                  <tr key={option}>
                    <td className="border border-gray-300 py-1.5 px-3">{option}</td>
                    <td 
                      className={cn(
                        "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                        hasMappingAny(`${option} Α`, 'single_leg_squat')
                          ? "bg-black text-white"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleOpenDialog(`${option} Α`, 'single_leg_squat')}
                    >
                      ✓
                    </td>
                    <td 
                      className={cn(
                        "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                        hasMappingAny(`${option} Δ`, 'single_leg_squat')
                          ? "bg-black text-white"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleOpenDialog(`${option} Δ`, 'single_leg_squat')}
                    >
                      ✓
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Καθήματα */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Καθήματα</h3>
          <table className="w-full border-collapse text-xs">
            <tbody>
              {squatTopOptions.map((option) => (
                <tr
                  key={option}
                  onClick={() => handleOpenDialog(option, 'squat')}
                  className={cn(
                    "cursor-pointer transition-colors",
                    hasMappingAny(option, 'squat')
                      ? "bg-black text-white"
                      : "bg-white hover:bg-gray-50"
                  )}
                >
                  <td className="border border-gray-300 py-1.5 px-3" colSpan={3}>
                    {option}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full border-collapse text-xs mt-2">
            <thead>
              <tr>
                <th className="border border-gray-300 py-1.5 px-3 text-left font-semibold">Επιλογή</th>
                <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Α</th>
                <th className="border border-gray-300 py-1.5 px-2 text-center font-semibold w-10">Δ</th>
              </tr>
            </thead>
            <tbody>
              {squatBottomOptions.map((option) => (
                <tr key={option}>
                  <td className="border border-gray-300 py-1.5 px-3">{option}</td>
                  <td 
                    className={cn(
                      "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                      hasMappingAny(`${option} Α`, 'squat')
                        ? "bg-black text-white"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => handleOpenDialog(`${option} Α`, 'squat')}
                  >
                    ✓
                  </td>
                  <td 
                    className={cn(
                      "border border-gray-300 py-1.5 px-2 text-center cursor-pointer transition-colors",
                      hasMappingAny(`${option} Δ`, 'squat')
                        ? "bg-black text-white"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => handleOpenDialog(`${option} Δ`, 'squat')}
                  >
                    ✓
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FMS */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">FMS</h3>
          </div>
          
          {/* Legend */}
          <div className="flex gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500"></div>
              <span>Απαγορεύεται</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400"></div>
              <span>Με προσοχή</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500"></div>
              <span>Ασφαλές</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {fmsRows.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className={cn(
                  "grid gap-2",
                  rowIndex === 2 ? "grid-cols-3" : "grid-cols-2"
                )}
              >
                {row.map((exercise) => (
                  <div key={exercise} className="border border-gray-300 p-2">
                    <div className="text-xs font-medium mb-2 text-center">{exercise}</div>
                    {hasLeftRight.includes(exercise) ? (
                      <div className="space-y-1">
                        {/* Left side */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold w-3">L</span>
                          <div className="flex gap-0.5 flex-1">
                            {(['forbidden', 'caution', 'safe'] as const).map((level) => {
                              const cellKey = `${exercise} L ${level}`;
                              const hasExercises = hasFmsExercises(cellKey);
                              const bgClass = level === 'forbidden' 
                                ? (hasExercises ? "bg-red-500 text-white" : "bg-red-100 hover:bg-red-200")
                                : level === 'caution'
                                  ? (hasExercises ? "bg-yellow-400 text-black" : "bg-yellow-100 hover:bg-yellow-200")
                                  : (hasExercises ? "bg-green-500 text-white" : "bg-green-100 hover:bg-green-200");
                              const icon = level === 'forbidden' ? '✗' : level === 'caution' ? '!' : '✓';
                              
                              return (
                                <div 
                                  key={level}
                                  className={cn(
                                    "flex-1 text-center py-1 text-[10px] cursor-pointer transition-colors border min-h-[24px] relative group",
                                    bgClass
                                  )}
                                  onClick={() => handleFmsCellClick(cellKey)}
                                  title={fmsExercises[cellKey]?.map(e => e.name).join(', ') || 'Κλικ για προσθήκη άσκησης'}
                                >
                                  {hasExercises ? (
                                    <span className="font-bold">{fmsExercises[cellKey]?.length}</span>
                                  ) : icon}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Right side */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold w-3">R</span>
                          <div className="flex gap-0.5 flex-1">
                            {(['forbidden', 'caution', 'safe'] as const).map((level) => {
                              const cellKey = `${exercise} R ${level}`;
                              const hasExercises = hasFmsExercises(cellKey);
                              const bgClass = level === 'forbidden' 
                                ? (hasExercises ? "bg-red-500 text-white" : "bg-red-100 hover:bg-red-200")
                                : level === 'caution'
                                  ? (hasExercises ? "bg-yellow-400 text-black" : "bg-yellow-100 hover:bg-yellow-200")
                                  : (hasExercises ? "bg-green-500 text-white" : "bg-green-100 hover:bg-green-200");
                              const icon = level === 'forbidden' ? '✗' : level === 'caution' ? '!' : '✓';
                              
                              return (
                                <div 
                                  key={level}
                                  className={cn(
                                    "flex-1 text-center py-1 text-[10px] cursor-pointer transition-colors border min-h-[24px] relative group",
                                    bgClass
                                  )}
                                  onClick={() => handleFmsCellClick(cellKey)}
                                  title={fmsExercises[cellKey]?.map(e => e.name).join(', ') || 'Κλικ για προσθήκη άσκησης'}
                                >
                                  {hasExercises ? (
                                    <span className="font-bold">{fmsExercises[cellKey]?.length}</span>
                                  ) : icon}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        {(['forbidden', 'caution', 'safe'] as const).map((level) => {
                          const cellKey = `${exercise} ${level}`;
                          const hasExercises = hasFmsExercises(cellKey);
                          const bgClass = level === 'forbidden' 
                            ? (hasExercises ? "bg-red-500 text-white" : "bg-red-100 hover:bg-red-200")
                            : level === 'caution'
                              ? (hasExercises ? "bg-yellow-400 text-black" : "bg-yellow-100 hover:bg-yellow-200")
                              : (hasExercises ? "bg-green-500 text-white" : "bg-green-100 hover:bg-green-200");
                          const icon = level === 'forbidden' ? '✗' : level === 'caution' ? '!' : '✓';
                          
                          return (
                            <div 
                              key={level}
                              className={cn(
                                "flex-1 text-center py-1 text-[10px] cursor-pointer transition-colors border min-h-[24px] relative group",
                                bgClass
                              )}
                              onClick={() => handleFmsCellClick(cellKey)}
                              title={fmsExercises[cellKey]?.map(e => e.name).join(', ') || 'Κλικ για προσθήκη άσκησης'}
                            >
                              {hasExercises ? (
                                <span className="font-bold">{fmsExercises[cellKey]?.length}</span>
                              ) : icon}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-none max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">{selectedIssue}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-3 sm:mt-4">
            {/* Διάταση - ΑΡΙΣΤΕΡΑ */}
            <div className="border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-4">
                <MoveHorizontal className="w-4 h-4" />
                Διάταση
              </div>
              
              <div className="space-y-2 mb-4">
                {dialogStretch.length === 0 ? (
                  <p className="text-xs text-gray-400">Δεν υπάρχουν μύες</p>
                ) : (
                  dialogStretch.map(m => (
                    <div 
                      key={m.id} 
                      className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 text-sm"
                    >
                      <span>{m.muscles?.name}</span>
                      <button
                        onClick={() => handleDeleteMapping(m.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Αναζήτηση μυός..."
                  value={muscleSearchStretch}
                  onChange={(e) => setMuscleSearchStretch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-none text-sm"
                />
                <div className="max-h-40 overflow-y-auto border">
                  {muscles
                    .filter(m => m.name.toLowerCase().includes(muscleSearchStretch.toLowerCase()))
                    .map(muscle => {
                      const isAlreadyMapped = isMuscleAlreadyMapped(muscle.id, 'stretch');
                      const isSelected = selectedMusclesStretch.includes(muscle.id);
                      return (
                        <div
                          key={muscle.id}
                          onClick={() => toggleMuscleSelection(muscle.id, 'stretch')}
                          className={cn(
                            "px-3 py-2 text-sm cursor-pointer transition-colors",
                            isAlreadyMapped 
                              ? "bg-blue-100 text-blue-800 cursor-not-allowed" 
                              : isSelected 
                                ? "bg-blue-500 text-white" 
                                : "hover:bg-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="w-4 h-4" />}
                            {isAlreadyMapped && <span className="text-xs">(ήδη)</span>}
                            {muscle.name}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <Button 
                  onClick={() => handleAddMappings('stretch')}
                  className="w-full rounded-none bg-blue-600 hover:bg-blue-700"
                  disabled={selectedMusclesStretch.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Προσθήκη {selectedMusclesStretch.length > 0 && `(${selectedMusclesStretch.length})`}
                </Button>
              </div>
            </div>

            {/* Ενδυνάμωση - ΔΕΞΙΑ */}
            <div className="border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-4">
                <ArrowUp className="w-4 h-4" />
                Ενδυνάμωση
              </div>
              
              <div className="space-y-2 mb-4">
                {dialogStrengthen.length === 0 ? (
                  <p className="text-xs text-gray-400">Δεν υπάρχουν μύες</p>
                ) : (
                  dialogStrengthen.map(m => (
                    <div 
                      key={m.id} 
                      className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 text-sm"
                    >
                      <span>{m.muscles?.name}</span>
                      <button
                        onClick={() => handleDeleteMapping(m.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Αναζήτηση μυός..."
                  value={muscleSearchStrengthen}
                  onChange={(e) => setMuscleSearchStrengthen(e.target.value)}
                  className="w-full px-3 py-2 border rounded-none text-sm"
                />
                <div className="max-h-40 overflow-y-auto border">
                  {muscles
                    .filter(m => m.name.toLowerCase().includes(muscleSearchStrengthen.toLowerCase()))
                    .map(muscle => {
                      const isAlreadyMapped = isMuscleAlreadyMapped(muscle.id, 'strengthen');
                      const isSelected = selectedMusclesStrengthen.includes(muscle.id);
                      return (
                        <div
                          key={muscle.id}
                          onClick={() => toggleMuscleSelection(muscle.id, 'strengthen')}
                          className={cn(
                            "px-3 py-2 text-sm cursor-pointer transition-colors",
                            isAlreadyMapped 
                              ? "bg-green-100 text-green-800 cursor-not-allowed" 
                              : isSelected 
                                ? "bg-green-500 text-white" 
                                : "hover:bg-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="w-4 h-4" />}
                            {isAlreadyMapped && <span className="text-xs">(ήδη)</span>}
                            {muscle.name}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <Button 
                  onClick={() => handleAddMappings('strengthen')}
                  className="w-full rounded-none bg-green-600 hover:bg-green-700"
                  disabled={selectedMusclesStrengthen.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Προσθήκη {selectedMusclesStrengthen.length > 0 && `(${selectedMusclesStrengthen.length})`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FMS Exercise Selection Dialog */}
      <SimpleExerciseSelectionDialog
        open={exerciseDialogOpen}
        onOpenChange={setExerciseDialogOpen}
        exercises={exercises.map(e => ({
          id: e.id,
          name: e.name,
          description: e.description || undefined,
          video_url: e.video_url || undefined
        }))}
        onSelectExercise={handleExerciseSelected}
      />
    </>
  );
};
