
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Save, ClipboardPaste, GripVertical, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProgramClipboard } from '@/contexts/ProgramClipboardContext';
import { useExercises } from '@/hooks/useExercises';
import { SimpleExerciseSelectionDialog } from './SimpleExerciseSelectionDialog';
import { formatTimeInput } from '@/utils/timeFormatting';

interface CreateBlockTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TRAINING_TYPE_LABELS: Record<string, string> = {
  'warm up': 'warm up',
  str: 'str',
  'str/spd': 'str/spd',
  pwr: 'pwr',
  'spd/str': 'spd/str',
  spd: 'spd',
  'str/end': 'str/end',
  'pwr/end': 'pwr/end',
  'spd/end': 'spd/end',
  end: 'end',
  hpr: 'hpr',
  recovery: 'rec',
  accessory: 'acc',
  rotational: 'rot',
};

const WORKOUT_FORMAT_LABELS: Record<string, string> = {
  non_stop: 'Non Stop',
  emom: 'EMOM',
  for_time: 'For Time',
  amrap: 'AMRAP',
};

export const CreateBlockTemplateDialog: React.FC<CreateBlockTemplateDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [templateName, setTemplateName] = useState('');
  const [trainingType, setTrainingType] = useState('');
  const [workoutFormat, setWorkoutFormat] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [blockSets, setBlockSets] = useState(1);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  const { paste, hasBlock } = useProgramClipboard();
  const { exercises: availableExercises } = useExercises();

  const handlePasteBlock = () => {
    const clipboardData = paste();
    if (clipboardData && clipboardData.type === 'block') {
      const block = clipboardData.data as any;
      setTemplateName(block.name || '');
      setTrainingType(block.training_type || '');
      setWorkoutFormat(block.workout_format || '');
      setWorkoutDuration(block.workout_duration || '');
      setBlockSets(block.block_sets || 1);
      setExercises(block.program_exercises || []);
      toast.success('Block επικολλήθηκε!');
    }
  };

  const handleAddExercise = (exerciseId: string) => {
    const exercise = availableExercises.find(e => e.id === exerciseId);
    if (exercise) {
      const newExercise = {
        id: crypto.randomUUID(),
        exercise_id: exerciseId,
        exercise_order: exercises.length + 1,
        sets: '',
        reps: '',
        kg: '',
        percentage_1rm: '',
        velocity_ms: '',
        tempo: '',
        rest: '',
        notes: '',
        exercises: exercise
      };
      setExercises([...exercises, newExercise]);
    }
    setShowExerciseDialog(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(exercises.filter(e => e.id !== exerciseId));
  };

  const handleUpdateExercise = (exerciseId: string, field: string, value: any) => {
    setExercises(exercises.map(e => 
      e.id === exerciseId ? { ...e, [field]: value } : e
    ));
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Το όνομα είναι υποχρεωτικό');
      return;
    }

    try {
      setSaving(true);
      
      const exercisesForStorage = exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        exercise_order: ex.exercise_order,
        sets: ex.sets,
        reps: ex.reps,
        reps_mode: ex.reps_mode,
        kg: ex.kg,
        kg_mode: ex.kg_mode,
        percentage_1rm: ex.percentage_1rm,
        velocity_ms: ex.velocity_ms,
        tempo: ex.tempo,
        rest: ex.rest,
        notes: ex.notes,
        exercise_name: ex.exercises?.name
      }));

      const { error } = await supabase
        .from('block_templates')
        .insert({
          name: templateName.trim(),
          training_type: trainingType || null,
          workout_format: workoutFormat || null,
          workout_duration: workoutDuration || null,
          block_sets: blockSets,
          exercises: exercisesForStorage
        });

      if (error) throw error;

      toast.success('Block template αποθηκεύτηκε!');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving block template:', error);
      toast.error('Σφάλμα κατά την αποθήκευση');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTemplateName('');
    setTrainingType('');
    setWorkoutFormat('');
    setWorkoutDuration('');
    setBlockSets(1);
    setExercises([]);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-none p-3">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm flex items-center justify-between">
              <span>Δημιουργία Block Template</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasteBlock}
                disabled={!hasBlock}
                className={`rounded-none h-7 text-xs ${hasBlock ? 'text-[#00ffba] border-[#00ffba]' : ''}`}
              >
                <ClipboardPaste className="w-3 h-3 mr-1" />
                Επικόλληση Block
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Template Name Input */}
          <div className="mb-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Όνομα Template *"
              className="rounded-none h-8 text-xs"
            />
          </div>

          {/* Block Card - Same UI as ProgramBuilder */}
          <Card className="rounded-none w-full" style={{ backgroundColor: '#31365d' }}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CardHeader className="p-1 space-y-0">
                <div className="flex justify-between items-center">
                  <CollapsibleTrigger className="flex items-center gap-2 hover:bg-gray-600 p-1 rounded">
                    {isOpen ? <ChevronDown className="w-3 h-3 text-white" /> : <ChevronRight className="w-3 h-3 text-white" />}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Select value={trainingType || ''} onValueChange={setTrainingType}>
                        <SelectTrigger className="h-6 text-xs rounded-none bg-gray-700 border-gray-600 text-white w-[100px]">
                          <SelectValue placeholder="Τύπος" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none bg-white z-50">
                          {Object.entries(TRAINING_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!isOpen && exercises.length > 0 && (
                        <span className="text-xs bg-gray-500 px-2 py-1 rounded-full text-white">
                          {exercises.length}
                        </span>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <Button
                    onClick={() => setShowExerciseDialog(true)}
                    size="sm"
                    variant="ghost"
                    className="rounded-none hover:bg-gray-600"
                  >
                    <Plus className="w-2 h-2 text-white" />
                  </Button>
                </div>
                
                {/* Training Type, Workout Format and Sets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={workoutFormat || 'none'} onValueChange={(value) => setWorkoutFormat(value === 'none' ? '' : value)}>
                    <SelectTrigger className="h-6 text-xs rounded-none bg-gray-700 border-gray-600 text-white w-[110px]" onClick={(e) => e.stopPropagation()}>
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none bg-white z-50">
                      <SelectItem value="none" className="text-xs">Κανένα</SelectItem>
                      {Object.entries(WORKOUT_FORMAT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {workoutFormat && workoutFormat !== 'none' && (
                    <Input
                      type="text"
                      value={workoutDuration || ''}
                      onChange={(e) => setWorkoutDuration(formatTimeInput(e.target.value))}
                      placeholder="00:00"
                      className="h-6 w-[70px] text-xs rounded-none bg-gray-700 border-gray-600 text-white text-center"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-gray-400">Set</span>
                    <button
                      type="button"
                      onClick={() => setBlockSets(Math.max(1, blockSets - 1))}
                      className="p-0.5 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <span className="text-xs text-white min-w-[16px] text-center">{blockSets}</span>
                    <button
                      type="button"
                      onClick={() => setBlockSets(blockSets + 1)}
                      className="p-0.5 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    {blockSets > 1 && (
                      <span className="text-xs text-[#00ffba]">x{blockSets}</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="p-0 m-0">
                  {exercises.length === 0 ? (
                    <div className="p-3 text-center text-gray-400 text-xs">
                      Κάντε κλικ στο + για να προσθέσετε ασκήσεις
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      {exercises.map((exercise, index) => (
                        <div 
                          key={exercise.id} 
                          className="flex items-center gap-1 p-1 border-t border-gray-600 bg-gray-700/50 min-w-fit"
                        >
                          <GripVertical className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <span className="text-[10px] text-white min-w-[20px]">{index + 1}.</span>
                          <span className="text-[10px] text-white min-w-[100px] max-w-[150px] truncate">
                            {exercise.exercises?.name || 'Άγνωστη άσκηση'}
                          </span>
                          <Input
                            value={exercise.sets || ''}
                            onChange={(e) => handleUpdateExercise(exercise.id, 'sets', e.target.value)}
                            placeholder="Sets"
                            className="h-5 w-9 text-[10px] rounded-none bg-gray-600 border-gray-500 text-white text-center px-0.5"
                          />
                          <Input
                            value={exercise.reps || ''}
                            onChange={(e) => handleUpdateExercise(exercise.id, 'reps', e.target.value)}
                            placeholder="Reps"
                            className="h-5 w-9 text-[10px] rounded-none bg-gray-600 border-gray-500 text-white text-center px-0.5"
                          />
                          <Input
                            value={exercise.percentage_1rm || ''}
                            onChange={(e) => handleUpdateExercise(exercise.id, 'percentage_1rm', e.target.value)}
                            placeholder="%1RM"
                            className="h-5 w-10 text-[10px] rounded-none bg-gray-600 border-gray-500 text-white text-center px-0.5"
                          />
                          <Input
                            value={exercise.kg || ''}
                            onChange={(e) => handleUpdateExercise(exercise.id, 'kg', e.target.value)}
                            placeholder="Kg"
                            className="h-5 w-9 text-[10px] rounded-none bg-gray-600 border-gray-500 text-white text-center px-0.5"
                          />
                          <Input
                            value={exercise.velocity_ms || ''}
                            onChange={(e) => handleUpdateExercise(exercise.id, 'velocity_ms', e.target.value)}
                            placeholder="m/s"
                            className="h-5 w-9 text-[10px] rounded-none bg-gray-600 border-gray-500 text-white text-center px-0.5"
                          />
                          <Input
                            value={exercise.tempo || ''}
                            onChange={(e) => handleUpdateExercise(exercise.id, 'tempo', e.target.value)}
                            placeholder="Tempo"
                            className="h-5 w-11 text-[10px] rounded-none bg-gray-600 border-gray-500 text-white text-center px-0.5"
                          />
                          <Input
                            value={exercise.rest || ''}
                            onChange={(e) => handleUpdateExercise(exercise.id, 'rest', e.target.value)}
                            placeholder="Rest"
                            className="h-5 w-9 text-[10px] rounded-none bg-gray-600 border-gray-500 text-white text-center px-0.5"
                          />
                          <Button
                            onClick={() => handleRemoveExercise(exercise.id)}
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 rounded-none hover:bg-red-600/20 flex-shrink-0"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="rounded-none h-8 text-xs"
            >
              Ακύρωση
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || !templateName.trim()}
              className="rounded-none h-8 text-xs bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              <Save className="w-3 h-3 mr-1" />
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SimpleExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={availableExercises}
        onSelectExercise={handleAddExercise}
      />
    </>
  );
};
