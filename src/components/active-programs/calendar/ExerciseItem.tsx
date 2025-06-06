
import React from 'react';
import { ExerciseNotes } from './ExerciseNotes';
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';
import { ExerciseActualValues } from './ExerciseActualValues';

interface ExerciseItemProps {
  exercise: any;
  workoutInProgress: boolean;
  isComplete: boolean;
  remainingText: string;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  clearNotes: (exerciseId: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  clearKg: (exerciseId: string) => void;
  updateVelocity: (exerciseId: string, velocity: number) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: number) => void;
  clearReps: (exerciseId: string) => void;
  selectedDate?: Date;
  program?: any;
  getRemainingText?: (exerciseId: string, totalSets: number) => string;
  isExerciseComplete?: (exerciseId: string, totalSets: number) => boolean;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  workoutInProgress,
  isComplete,
  remainingText,
  onExerciseClick,
  onSetClick,
  onVideoClick,
  updateKg,
  updateVelocity,
  updateReps,
  getNotes,
  updateNotes,
  clearNotes,
  selectedDate,
  program,
  getRemainingText,
  isExerciseComplete
}) => {
  const handleClick = (event: React.MouseEvent) => {
    onExerciseClick(exercise, event);
  };

  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onVideoClick(exercise);
  };

  const handleSetDecrement = (exerciseId: string, totalSets: number) => {
    onSetClick(exerciseId, totalSets, {} as React.MouseEvent);
  };

  return (
    <div 
      className={`border border-gray-200 rounded-none transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
      onClick={handleClick}
    >
      <ExerciseHeader
        exercise={exercise}
        isComplete={isComplete}
        remainingText={remainingText}
        workoutInProgress={workoutInProgress}
        onVideoClick={handleVideoClick}
        onSetClick={handleSetClick}
      />

      <div className="p-3">
        <ExerciseDetails exercise={exercise} />

        <ExerciseActualValues
          exercise={exercise}
          workoutInProgress={workoutInProgress}
          updateReps={updateReps}
          updateKg={updateKg}
          updateVelocity={updateVelocity}
          getNotes={getNotes}
          updateNotes={updateNotes}
          selectedDate={selectedDate}
          program={program}
          onSetClick={handleSetDecrement}
          getRemainingText={getRemainingText}
          isExerciseComplete={isExerciseComplete}
        />

        <ExerciseNotes
          exerciseId={exercise.id}
          workoutInProgress={workoutInProgress}
          onNotesChange={updateNotes}
          onClearNotes={clearNotes}
          selectedDate={selectedDate}
          program={program}
        />

        {exercise.notes && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-none">
            <p className="text-xs text-blue-800 font-medium">Program Notes:</p>
            <p className="text-xs text-blue-700">{exercise.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
