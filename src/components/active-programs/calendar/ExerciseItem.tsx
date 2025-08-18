
import React from 'react';
import { ExerciseNotes } from './ExerciseNotes';
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';
import { isValidVideoUrl } from '@/utils/videoUtils';

interface ExerciseItemProps {
  exercise: any;
  exerciseNumber: number;
  workoutInProgress: boolean;
  getRemainingText: (exerciseId: string) => string;
  isExerciseComplete: (exerciseId: string, totalSets: number) => boolean;
  onExerciseClick: (exercise: any, event: React.MouseEvent) => void;
  onSetClick: (exerciseId: string, totalSets: number, event: React.MouseEvent) => void;
  onVideoClick: (exercise: any) => void;
  getNotes: (exerciseId: string) => string;
  updateNotes: (exerciseId: string, notes: string) => void;
  clearNotes: (exerciseId: string) => void;
  updateKg: (exerciseId: string, kg: string) => void;
  clearKg: (exerciseId: string) => void;
  updateVelocity: (exerciseId: string, velocity: string) => void;
  clearVelocity: (exerciseId: string) => void;
  updateReps: (exerciseId: string, reps: string) => void;
  clearReps: (exerciseId: string) => void;
  selectedDate?: Date;
  program?: any;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  exerciseNumber,
  workoutInProgress,
  getRemainingText,
  isExerciseComplete,
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
  program
}) => {
  const handleClick = (event: React.MouseEvent) => {
    console.log('🖱️ ExerciseItem click detected for:', exercise.exercises?.name);
    console.log('🏃 Workout status:', workoutInProgress);
    
    onExerciseClick(exercise, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('🎬 Direct video click detected for:', exercise.exercises?.name);
    
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      onVideoClick(exercise);
    } else {
      console.log('❌ No valid video URL found');
    }
  };

  const handleSetsAreaClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (workoutInProgress) {
      onSetClick(exercise.id, exercise.sets, event);
    }
  };

  const isComplete = isExerciseComplete(exercise.id, exercise.sets);
  const remainingText = getRemainingText(exercise.id);

  return (
    <div 
      className={`border border-gray-200 rounded-none transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
      onClick={handleClick}
    >
      <ExerciseHeader
        exercise={exercise}
        exerciseNumber={exerciseNumber}
        isComplete={isComplete}
        remainingText={remainingText}
        workoutInProgress={workoutInProgress}
        onVideoClick={handleVideoClick}
        onSetClick={handleSetsAreaClick}
      />

      <div className="p-3">
        <ExerciseDetails 
          exercise={exercise} 
          onVideoClick={onVideoClick}
          onSetClick={onSetClick}
          workoutInProgress={workoutInProgress}
          getRemainingText={getRemainingText}
          updateReps={updateReps}
          updateKg={updateKg}
          updateVelocity={updateVelocity}
          selectedDate={selectedDate}
          program={program}
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
