
import React, { useState, useEffect } from 'react';
import { getWorkoutData, saveWorkoutData, clearWorkoutData } from '@/hooks/useWorkoutCompletions/workoutDataService';
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';
import { ExerciseActualValues } from './ExerciseActualValues';

interface CompactExerciseItemProps {
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
}

export const CompactExerciseItem: React.FC<CompactExerciseItemProps> = ({
  exercise,
  workoutInProgress,
  isComplete,
  remainingText,
  onSetClick,
  onVideoClick,
  updateKg,
  updateVelocity,
  updateReps,
  getNotes,
  updateNotes,
  clearNotes,
  selectedDate,
  program
}) => {
  const handleSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSetClick(exercise.id, exercise.sets, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onVideoClick(exercise);
  };

  return (
    <div 
      className={`border border-gray-200 rounded-none transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
    >
      <ExerciseHeader
        exercise={exercise}
        isComplete={isComplete}
        remainingText={remainingText}
        workoutInProgress={workoutInProgress}
        onVideoClick={handleVideoClick}
        onSetClick={handleSetClick}
      />

      <div className="p-1 space-y-1">
        {/* Planned Values */}
        <ExerciseDetails exercise={exercise} />

        {/* Actual Values */}
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
        />

        {/* Program Notes */}
        {exercise.notes && (
          <div className="p-1 bg-blue-50 border border-blue-200 rounded-none">
            <p className="text-xs text-blue-800 font-medium">Program Notes:</p>
            <p className="text-xs text-blue-700">{exercise.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
