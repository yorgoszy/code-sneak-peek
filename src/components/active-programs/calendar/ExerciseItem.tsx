
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';

interface ExerciseItemProps {
  exercise: any;
  isComplete: boolean;
  remainingText: string;
  onVideoClick: (exercise: any) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  workoutInProgress: boolean;
  getRemainingText: (exerciseId: string) => string;
  getCompletedSets: (exerciseId: string) => number;
  updateReps: (exerciseId: string, value: string) => void;
  updateKg: (exerciseId: string, value: string) => void;
  updateVelocity: (exerciseId: string, value: string) => void;
  updateNotes: (exerciseId: string, value: string) => void;
  clearReps: (exerciseId: string) => void;
  clearKg: (exerciseId: string) => void;
  clearVelocity: (exerciseId: string) => void;
  clearNotes: (exerciseId: string) => void;
  getNotes: (exerciseId: string) => string;
  actualValues?: {
    reps?: string;
    kg?: string;
    velocity?: string;
  };
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  isComplete,
  remainingText,
  onVideoClick,
  onSetClick,
  workoutInProgress,
  getRemainingText,
  getCompletedSets,
  updateReps,
  updateKg,
  updateVelocity,
  updateNotes,
  clearReps,
  clearKg,
  clearVelocity,
  clearNotes,
  getNotes,
  actualValues
}) => {
  return (
    <Card className="rounded-none border-l-4 border-l-blue-500 mb-2">
      <CardContent className="p-0">
        <ExerciseHeader
          exercise={exercise}
          isComplete={isComplete}
          onVideoClick={onVideoClick}
        />
        
        <ExerciseDetails
          exercise={exercise}
          isComplete={isComplete}
          remainingText={remainingText}
          onSetClick={onSetClick}
          workoutInProgress={workoutInProgress}
          getRemainingText={getRemainingText}
          getCompletedSets={getCompletedSets}
          updateReps={updateReps}
          updateKg={updateKg}
          updateVelocity={updateVelocity}
          updateNotes={updateNotes}
          clearReps={clearReps}
          clearKg={clearKg}
          clearVelocity={clearVelocity}
          clearNotes={clearNotes}
          getNotes={getNotes}
          actualValues={actualValues}
        />
      </CardContent>
    </Card>
  );
};
