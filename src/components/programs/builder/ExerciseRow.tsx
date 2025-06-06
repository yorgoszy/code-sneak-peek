
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, GripVertical } from "lucide-react";
import { Exercise } from '../types';

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface ExerciseRowProps {
  exercise: ProgramExercise;
  exercises: Exercise[];
  allBlockExercises: ProgramExercise[];
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  exercises,
  allBlockExercises,
  onUpdate,
  onRemove,
  onDuplicate
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-none p-1 md:p-2 space-y-2">
      {/* Mobile Header with grip and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <GripVertical className="h-3 w-3 md:h-4 md:w-4 text-gray-400 cursor-move flex-shrink-0" />
          
          {/* Exercise Name - Full width on mobile */}
          <div className="flex-1 min-w-0">
            <Select value={exercise.exercise_id} onValueChange={(value) => onUpdate('exercise_id', value)}>
              <SelectTrigger className="rounded-none h-7 md:h-8 text-xs md:text-sm">
                <SelectValue placeholder="Επιλέξτε άσκηση" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-0.5 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicate}
            className="rounded-none h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onRemove}
            className="rounded-none h-6 w-6 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Exercise Parameters - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-2">
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Sets</label>
          <Input
            type="number"
            value={exercise.sets}
            onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 0)}
            className="rounded-none h-6 md:h-7 text-xs"
            min="1"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Reps</label>
          <Input
            value={exercise.reps}
            onChange={(e) => onUpdate('reps', e.target.value)}
            placeholder="8-12"
            className="rounded-none h-6 md:h-7 text-xs"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-0.5">%1RM</label>
          <Input
            type="number"
            value={exercise.percentage_1rm}
            onChange={(e) => onUpdate('percentage_1rm', parseInt(e.target.value) || 0)}
            className="rounded-none h-6 md:h-7 text-xs"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Kg</label>
          <Input
            value={exercise.kg}
            onChange={(e) => onUpdate('kg', e.target.value)}
            placeholder="80-90"
            className="rounded-none h-6 md:h-7 text-xs"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Tempo</label>
          <Input
            value={exercise.tempo}
            onChange={(e) => onUpdate('tempo', e.target.value)}
            placeholder="3010"
            className="rounded-none h-6 md:h-7 text-xs"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Rest (s)</label>
          <Input
            value={exercise.rest}
            onChange={(e) => onUpdate('rest', e.target.value)}
            placeholder="90-120"
            className="rounded-none h-6 md:h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
};
