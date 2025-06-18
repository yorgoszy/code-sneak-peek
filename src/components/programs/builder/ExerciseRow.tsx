
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import { Exercise, ProgramExercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { ExerciseRowHeader } from './ExerciseRowHeader';
import { ExerciseRowDetails } from './ExerciseRowDetails';

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
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  const handleExerciseSelect = (exerciseId: string) => {
    onUpdate('exercise_id', exerciseId);
    setShowExerciseDialog(false);
  };

  const selectedExercise = exercises.find(ex => ex.id === exercise.exercise_id);
  
  // Calculate exercise number for this specific exercise
  const getExerciseNumber = () => {
    const sameExercises = allBlockExercises
      .filter(ex => ex.exercise_id === exercise.exercise_id && ex.exercise_id)
      .sort((a, b) => a.exercise_order - b.exercise_order);
    
    const currentIndex = sameExercises.findIndex(ex => ex.id === exercise.id);
    return sameExercises.length > 1 ? currentIndex + 1 : null;
  };

  const exerciseNumber = getExerciseNumber();

  return (
    <>
      <div className="bg-white border-0 border-b w-full" style={{ fontSize: '12px' }}>
        <ExerciseRowHeader
          selectedExercise={selectedExercise}
          exerciseNumber={exerciseNumber}
          onSelectExercise={() => setShowExerciseDialog(true)}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
        
        <ExerciseRowDetails
          exercise={exercise}
          onUpdate={onUpdate}
        />
      </div>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
      />
    </>
  );
};
