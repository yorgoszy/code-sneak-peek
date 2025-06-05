
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getWorkoutData, saveWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';

interface ExerciseActualValuesProps {
  exercise: any;
  workoutInProgress: boolean;
  updateReps: (exerciseId: string, reps: number) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  updateVelocity: (exerciseId: string, velocity: number) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  selectedDate?: Date;
  program?: any;
}

export const ExerciseActualValues: React.FC<ExerciseActualValuesProps> = ({
  exercise,
  workoutInProgress,
  updateReps,
  updateKg,
  updateVelocity,
  getNotes,
  updateNotes,
  selectedDate,
  program
}) => {
  const [actualKg, setActualKg] = useState('');
  const [actualReps, setActualReps] = useState('');
  const [actualVelocity, setActualVelocity] = useState('');
  const notes = getNotes(exercise.id);

  // Load data from previous week
  useEffect(() => {
    if (selectedDate && program) {
      const data = getWorkoutData(selectedDate, program.id, exercise.id);
      if (data.kg) setActualKg(data.kg);
      if (data.reps) setActualReps(data.reps);
      if (data.velocity) setActualVelocity(data.velocity);
    }
  }, [selectedDate, program, exercise.id]);

  const handleKgChange = (value: string) => {
    setActualKg(value);
    if (workoutInProgress) {
      updateKg(exercise.id, value);
    }
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { kg: value });
    }
  };

  const handleRepsChange = (value: string) => {
    setActualReps(value);
    if (workoutInProgress) {
      updateReps(exercise.id, parseInt(value) || 0);
    }
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { reps: value });
    }
  };

  const handleVelocityChange = (value: string) => {
    setActualVelocity(value);
    if (workoutInProgress) {
      updateVelocity(exercise.id, parseFloat(value) || 0);
    }
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { velocity: value });
    }
  };

  const handleNotesChange = (value: string) => {
    updateNotes(exercise.id, value);
    
    if (selectedDate && program) {
      saveWorkoutData(selectedDate, program.id, exercise.id, { notes: value });
    }
  };

  return (
    <div className="grid grid-cols-8 gap-0.5 text-xs">
      <div className="text-center">
        <div className="bg-gray-200 px-1 py-0.5 rounded-none text-xs">-</div>
      </div>
      <div className="text-center">
        <Input
          type="number"
          value={actualReps}
          onChange={(e) => handleRepsChange(e.target.value)}
          className="h-5 text-xs rounded-none text-center p-0"
          placeholder={exercise.reps || ''}
          disabled={!workoutInProgress}
        />
      </div>
      <div className="text-center">
        <div className="bg-gray-200 px-1 py-0.5 rounded-none text-xs">-</div>
      </div>
      <div className="text-center">
        <Input
          type="number"
          step="0.5"
          value={actualKg}
          onChange={(e) => handleKgChange(e.target.value)}
          className="h-5 text-xs rounded-none text-center p-0"
          placeholder={exercise.kg || ''}
          disabled={!workoutInProgress}
        />
      </div>
      <div className="text-center">
        <Input
          type="number"
          step="0.01"
          value={actualVelocity}
          onChange={(e) => handleVelocityChange(e.target.value)}
          className="h-5 text-xs rounded-none text-center p-0"
          placeholder={exercise.velocity_ms || ''}
          disabled={!workoutInProgress}
        />
      </div>
      <div className="text-center">
        <div className="bg-gray-200 px-1 py-0.5 rounded-none text-xs">-</div>
      </div>
      <div className="text-center">
        <div className="bg-gray-200 px-1 py-0.5 rounded-none text-xs">-</div>
      </div>
      <div className="text-center">
        <Textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder={workoutInProgress ? "Notes..." : ""}
          className="h-5 text-xs rounded-none resize-none p-0.5"
          disabled={!workoutInProgress}
          rows={1}
        />
      </div>
    </div>
  );
};
