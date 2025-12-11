
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';

interface ExerciseItemProps {
  exercise: any;
  exerciseNumber: number;
  isComplete?: boolean;
  remainingText?: string;
  onVideoClick: (exercise: any) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onExerciseClick?: (exercise: any, event: React.MouseEvent) => void;
  workoutInProgress: boolean;
  getRemainingText: (exerciseId: string) => string;
  getCompletedSets: (exerciseId: string) => number;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  updateReps: (exerciseId: string, value: string) => void;
  updateKg: (exerciseId: string, value: string) => void;
  updateVelocity: (exerciseId: string, value: string) => void;
  updateNotes?: (exerciseId: string, value: string) => void;
  clearReps?: (exerciseId: string) => void;
  clearKg?: (exerciseId: string) => void;
  clearVelocity?: (exerciseId: string) => void;
  clearNotes?: (exerciseId: string) => void;
  getNotes?: (exerciseId: string) => string;
  getKg: (exerciseId: string) => string;
  getReps: (exerciseId: string) => string;
  getVelocity: (exerciseId: string) => string;
  selectedDate?: Date;
  program?: any;
  actualValues?: {
    reps?: string;
    kg?: string;
    velocity?: string;
  };
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  exerciseNumber,
  isComplete: propIsComplete,
  remainingText: propRemainingText,
  onVideoClick,
  onSetClick,
  onExerciseClick,
  workoutInProgress,
  getRemainingText,
  getCompletedSets,
  isExerciseComplete,
  updateReps,
  updateKg,
  updateVelocity,
  updateNotes,
  clearReps,
  clearKg,
  clearVelocity,
  clearNotes,
  getNotes,
  getKg,
  getReps,
  getVelocity,
  selectedDate,
  program,
  actualValues
}) => {
  // Calculate derived values
  const isComplete = propIsComplete ?? isExerciseComplete(exercise.id, exercise.sets);
  const remainingText = propRemainingText ?? getRemainingText(exercise.id);

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onVideoClick(exercise);
  };

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };
  return (
    <Card className="rounded-none border-l-4 border-l-blue-500 mb-2">
      <CardContent className="p-0">
        <ExerciseHeader
          exercise={exercise}
          exerciseNumber={exerciseNumber}
          isComplete={isComplete}
          remainingText={remainingText}
          workoutInProgress={workoutInProgress}
          onVideoClick={handleVideoClick}
          onSetClick={handleSetClick}
        />
        
        <ExerciseDetails
          exercise={exercise}
          onSetClick={onSetClick}
          workoutInProgress={workoutInProgress}
          getRemainingText={getRemainingText}
          getCompletedSets={getCompletedSets}
          updateReps={updateReps}
          updateKg={updateKg}
          updateVelocity={updateVelocity}
          getKg={getKg}
          getReps={getReps}
          getVelocity={getVelocity}
        />
      </CardContent>
    </Card>
  );
};
