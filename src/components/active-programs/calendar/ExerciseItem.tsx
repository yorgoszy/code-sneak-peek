
import React from 'react';
import { ExerciseNotes } from './ExerciseNotes';
import { ExerciseHeader } from './ExerciseHeader';
import { ExerciseDetails } from './ExerciseDetails';
import { ExerciseActualValues } from './ExerciseActualValues';
import { isValidVideoUrl } from '@/utils/videoUtils';

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
  getRemainingText: (exerciseId: string, totalSets: number) => string;
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
  getRemainingText
}) => {
  const handleClick = (event: React.MouseEvent) => {
    // Αν το κλικ είναι στο video thumbnail, μην καλέσουμε το onExerciseClick
    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      return;
    }
    onExerciseClick(exercise, event);
  };

  const handleVideoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('🎬 Video click detected for:', exercise.exercises?.name);
    
    // Έλεγχος αν υπάρχει έγκυρο video URL
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

  return (
    <div 
      className={`border border-gray-200 rounded-none transition-colors ${
        workoutInProgress ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-100'
      } ${isComplete ? 'bg-green-50 border-green-200' : ''}`}
      onClick={handleClick}
    >
      <ExerciseHeader
        exercise={exercise}
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
          onSetClick={handleSetsAreaClick}
          workoutInProgress={workoutInProgress}
          getRemainingText={getRemainingText}
        />

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
          onSetClick={onSetClick}
          getRemainingText={getRemainingText}
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
