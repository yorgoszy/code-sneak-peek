
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  exercises,
  onUpdate,
  onRemove
}) => {
  return (
    <div className="grid grid-cols-8 gap-1 text-xs">
      <Select
        value={exercise.exercise_id}
        onValueChange={(value) => onUpdate('exercise_id', value)}
      >
        <SelectTrigger className="rounded-none h-8 text-xs col-span-2">
          <SelectValue placeholder="Άσκηση" />
        </SelectTrigger>
        <SelectContent>
          {exercises.map(ex => (
            <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        className="rounded-none h-8 text-xs"
        placeholder="Sets"
        type="number"
        value={exercise.sets}
        onChange={(e) => onUpdate('sets', parseInt(e.target.value))}
      />
      
      <Input
        className="rounded-none h-8 text-xs"
        placeholder="Reps"
        value={exercise.reps}
        onChange={(e) => onUpdate('reps', e.target.value)}
      />
      
      <Input
        className="rounded-none h-8 text-xs"
        placeholder="%1RM"
        type="number"
        value={exercise.percentage_1rm}
        onChange={(e) => onUpdate('percentage_1rm', parseInt(e.target.value))}
      />
      
      <Input
        className="rounded-none h-8 text-xs"
        placeholder="kg"
        value={exercise.kg}
        onChange={(e) => onUpdate('kg', e.target.value)}
      />
      
      <Input
        className="rounded-none h-8 text-xs"
        placeholder="m/s"
        value={exercise.velocity_ms}
        onChange={(e) => onUpdate('velocity_ms', e.target.value)}
      />
      
      <Button
        onClick={onRemove}
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
      >
        <Trash2 className="w-2 h-2" />
      </Button>
    </div>
  );
};
