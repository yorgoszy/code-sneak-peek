
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardPaste, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProgramClipboard } from '@/contexts/ProgramClipboardContext';

interface CreateBlockTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TRAINING_TYPES = [
  'warm up', 'pillar prep', 'movement prep', 'activation', 'plyos',
  'movement skills', 'med ball', 'power', 'str', 'str/spd', 'pwr',
  'spd/str', 'spd', 'str/end', 'pwr/end', 'spd/end', 'end', 'hpr',
  'mobility', 'neural act', 'stability', 'recovery', 'accessory', 'rotational'
];

const WORKOUT_FORMATS = ['straight sets', 'superset', 'circuit', 'emom', 'amrap', 'tabata'];

export const CreateBlockTemplateDialog: React.FC<CreateBlockTemplateDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trainingType, setTrainingType] = useState('');
  const [workoutFormat, setWorkoutFormat] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [blockSets, setBlockSets] = useState(1);
  const [exercises, setExercises] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const { paste, hasBlock, clearClipboard } = useProgramClipboard();

  const handlePasteBlock = () => {
    const clipboardData = paste();
    if (clipboardData && clipboardData.type === 'block') {
      const block = clipboardData.data as any;
      setName(block.name || '');
      setTrainingType(block.training_type || '');
      setWorkoutFormat(block.workout_format || '');
      setWorkoutDuration(block.workout_duration || '');
      setBlockSets(block.block_sets || 1);
      setExercises(block.program_exercises || []);
      toast.success('Block επικολλήθηκε!');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Το όνομα είναι υποχρεωτικό');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare exercises for storage (remove unnecessary data)
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
          name: name.trim(),
          description: description.trim() || null,
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
    setName('');
    setDescription('');
    setTrainingType('');
    setWorkoutFormat('');
    setWorkoutDuration('');
    setBlockSets(1);
    setExercises([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-none">
        <DialogHeader>
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

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Όνομα *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="π.χ. Upper Body Strength"
              className="rounded-none h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">Περιγραφή</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Προαιρετική περιγραφή..."
              className="rounded-none h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Τύπος Προπόνησης</Label>
              <Select value={trainingType} onValueChange={setTrainingType}>
                <SelectTrigger className="rounded-none h-8 text-xs">
                  <SelectValue placeholder="Επιλέξτε..." />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {TRAINING_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Workout Format</Label>
              <Select value={workoutFormat} onValueChange={setWorkoutFormat}>
                <SelectTrigger className="rounded-none h-8 text-xs">
                  <SelectValue placeholder="Επιλέξτε..." />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {WORKOUT_FORMATS.map(format => (
                    <SelectItem key={format} value={format} className="text-xs">
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Διάρκεια</Label>
              <Input
                value={workoutDuration}
                onChange={(e) => setWorkoutDuration(e.target.value)}
                placeholder="π.χ. 20 min"
                className="rounded-none h-8 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Block Sets</Label>
              <Input
                type="number"
                min={1}
                value={blockSets}
                onChange={(e) => setBlockSets(parseInt(e.target.value) || 1)}
                className="rounded-none h-8 text-xs"
              />
            </div>
          </div>

          {exercises.length > 0 && (
            <div className="border p-2 bg-gray-50">
              <Label className="text-xs font-medium">Ασκήσεις ({exercises.length})</Label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="text-[10px] text-gray-600 flex items-center gap-2">
                    <span className="font-medium">{idx + 1}.</span>
                    <span>{ex.exercises?.name || ex.exercise_name || 'Άγνωστη άσκηση'}</span>
                    {ex.sets && <span className="text-gray-400">({ex.sets} sets)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              disabled={saving || !name.trim()}
              className="rounded-none h-8 text-xs bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              <Save className="w-3 h-3 mr-1" />
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
