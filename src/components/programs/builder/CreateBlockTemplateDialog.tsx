
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, Save, ClipboardPaste, Copy, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProgramClipboard } from '@/contexts/ProgramClipboardContext';
import { useExercises } from '@/hooks/useExercises';
import { SimpleExerciseSelectionDialog } from './SimpleExerciseSelectionDialog';
import { formatTimeInput } from '@/utils/timeFormatting';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';

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

  const { paste, hasBlock, clearClipboard } = useProgramClipboard();
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
      clearClipboard();
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
        reps_mode: 'reps' as const,
        kg: '',
        kg_mode: 'kg' as const,
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

  const handleDuplicateExercise = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (exercise) {
      const newExercise = {
        ...exercise,
        id: crypto.randomUUID(),
        exercise_order: exercises.length + 1
      };
      setExercises([...exercises, newExercise]);
    }
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
        <DialogContent className="w-[95vw] max-w-[420px] h-[80vh] max-h-[600px] overflow-hidden rounded-none p-3 flex flex-col">
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

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
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
                    <div className="w-full">
                      {exercises.map((exercise, index) => {
                        const selectedExercise = exercise.exercises;
                        const videoUrl = selectedExercise?.video_url;
                        const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
                        const thumbnailUrl = hasValidVideo ? getVideoThumbnail(videoUrl) : null;

                        return (
                          <div key={exercise.id} className="bg-white border-0 border-b w-full" style={{ fontSize: '12px' }}>
                            {/* Exercise Selection Button - Same as ExerciseSelectionButton */}
                            <div className="px-2 py-0 border-b bg-gray-100 flex items-center gap-2 w-full" style={{ minHeight: '28px' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-sm h-6 justify-start px-2 bg-gray-200 hover:bg-gray-300"
                                style={{ borderRadius: '0px', fontSize: '12px' }}
                                onClick={() => setShowExerciseDialog(true)}
                              >
                                {selectedExercise ? (
                                  <div className="flex items-center gap-2 w-full">
                                    <div className="flex items-center gap-1 flex-1">
                                      <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded-sm">
                                        {index + 1}
                                      </span>
                                      <span className="truncate">{selectedExercise.name}</span>
                                    </div>
                                    
                                    {/* Video Thumbnail */}
                                    {hasValidVideo && thumbnailUrl ? (
                                      <div className="w-8 h-5 rounded-none overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                          src={thumbnailUrl}
                                          alt={`${selectedExercise.name} video thumbnail`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.currentTarget as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    ) : hasValidVideo ? (
                                      <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Play className="w-2 h-2 text-gray-400" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-5 rounded-none bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs text-gray-400">-</span>
                                      </div>
                                    )}
                                  </div>
                                ) : 'Επιλογή...'}
                              </Button>
                              
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicateExercise(exercise.id)}
                                  className="p-1 h-6 w-6"
                                  style={{ borderRadius: '0px' }}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveExercise(exercise.id)}
                                  className="p-1 h-6 w-6"
                                  style={{ borderRadius: '0px' }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Exercise Details Form - Same as ExerciseDetailsForm */}
                            <div className="flex px-2 py-0 gap-0 w-full" style={{ minHeight: '28px' }}>
                              <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Sets</label>
                                <Input
                                  type="text"
                                  value={exercise.sets || ''}
                                  onChange={(e) => handleUpdateExercise(exercise.id, 'sets', e.target.value)}
                                  className="text-center w-full"
                                  style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '0 4px' }}
                                />
                              </div>
                              
                              <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                <label 
                                  className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
                                  style={{ fontSize: '10px', color: '#666' }}
                                  onClick={() => {
                                    const currentMode = exercise.reps_mode || 'reps';
                                    let newMode: 'reps' | 'time' | 'meter';
                                    if (currentMode === 'reps') newMode = 'time';
                                    else if (currentMode === 'time') newMode = 'meter';
                                    else newMode = 'reps';
                                    handleUpdateExercise(exercise.id, 'reps_mode', newMode);
                                  }}
                                >
                                  {exercise.reps_mode === 'time' ? 'Time' : exercise.reps_mode === 'meter' ? 'Meter' : 'Reps'}
                                </label>
                                <Input
                                  value={exercise.reps_mode === 'time' ? formatTimeInput(String(exercise.reps || '')) : (exercise.reps || '')}
                                  onChange={(e) => {
                                    if (exercise.reps_mode === 'time') {
                                      const formatted = formatTimeInput(e.target.value);
                                      handleUpdateExercise(exercise.id, 'reps', formatted);
                                    } else {
                                      handleUpdateExercise(exercise.id, 'reps', e.target.value);
                                    }
                                  }}
                                  className="text-center w-full"
                                  style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '0 4px' }}
                                  placeholder={exercise.reps_mode === 'time' ? '00:00' : ''}
                                />
                              </div>
                              
                              <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>%1RM</label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={exercise.percentage_1rm || ''}
                                  onChange={(e) => handleUpdateExercise(exercise.id, 'percentage_1rm', e.target.value)}
                                  className="text-center w-full"
                                  style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '0 4px' }}
                                />
                              </div>
                              
                              <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                <label 
                                  className="block mb-1 text-center w-full cursor-pointer hover:text-[#00ffba]" 
                                  style={{ fontSize: '10px', color: '#666' }}
                                  onClick={() => {
                                    const currentMode = exercise.kg_mode || 'kg';
                                    let newMode: 'kg' | 'rpm' | 'meter' | 's/m' | 'km/h';
                                    if (currentMode === 'kg') newMode = 'rpm';
                                    else if (currentMode === 'rpm') newMode = 'meter';
                                    else if (currentMode === 'meter') newMode = 's/m';
                                    else if (currentMode === 's/m') newMode = 'km/h';
                                    else newMode = 'kg';
                                    handleUpdateExercise(exercise.id, 'kg_mode', newMode);
                                  }}
                                >
                                  {exercise.kg_mode === 'rpm' ? 'rpm' : exercise.kg_mode === 'meter' ? 'meter' : exercise.kg_mode === 's/m' ? 's/m' : exercise.kg_mode === 'km/h' ? 'km/h' : 'Kg'}
                                </label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={exercise.kg || ''}
                                  onChange={(e) => handleUpdateExercise(exercise.id, 'kg', e.target.value)}
                                  className="text-center w-full"
                                  style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '0 4px' }}
                                />
                              </div>
                              
                              <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>m/s</label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={exercise.velocity_ms || ''}
                                  onChange={(e) => handleUpdateExercise(exercise.id, 'velocity_ms', e.target.value)}
                                  className="text-center w-full"
                                  style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '0 4px' }}
                                />
                              </div>
                              
                              <div className="flex flex-col items-center" style={{ width: '60px' }}>
                                <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Tempo</label>
                                <Input
                                  value={exercise.tempo || ''}
                                  onChange={(e) => handleUpdateExercise(exercise.id, 'tempo', e.target.value)}
                                  className="text-center w-full"
                                  style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '0 4px' }}
                                  placeholder="1.1.1"
                                />
                              </div>
                              
                              <div className="flex flex-col items-center" style={{ width: '52px' }}>
                                <label className="block mb-1 text-center w-full" style={{ fontSize: '10px', color: '#666' }}>Rest</label>
                                <Input
                                  value={formatTimeInput(String(exercise.rest || ''))}
                                  onChange={(e) => {
                                    const formatted = formatTimeInput(e.target.value);
                                    handleUpdateExercise(exercise.id, 'rest', formatted);
                                  }}
                                  className="text-center w-full"
                                  style={{ borderRadius: '0px', fontSize: '12px', height: '22px', padding: '0 4px' }}
                                  placeholder="00:00"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          </div>

          {/* Save Button - Fixed at bottom */}
          <div className="flex justify-end gap-2 pt-3 border-t mt-2 flex-shrink-0">
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
