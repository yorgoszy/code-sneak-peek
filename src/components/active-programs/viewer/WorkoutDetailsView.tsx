
import React, { useState } from 'react';
import { Clock, Dumbbell } from "lucide-react";
import { ProgramBlocks } from '@/components/active-programs/calendar/ProgramBlocks';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { ExerciseInteractionHandler } from '@/components/active-programs/calendar/ExerciseInteractionHandler';
import { isValidVideoUrl } from '@/utils/videoUtils';
import { useExerciseCompletion } from '@/hooks/useExerciseCompletion';

interface WorkoutDetailsViewProps {
  currentDay: any;
  workoutInProgress: boolean;
  assignment: any;
}

export const WorkoutDetailsView: React.FC<WorkoutDetailsViewProps> = ({ 
  currentDay, 
  workoutInProgress,
  assignment 
}) => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  const exerciseCompletion = useExerciseCompletion();

  if (!currentDay) return null;

  const handleVideoClick = (exercise: any) => {
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    }
  };

  const handleSetClick = (exerciseId: string, totalSets: number, event: React.MouseEvent) => {
    if (!workoutInProgress) {
      console.log('⚠️ Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }
    exerciseCompletion.completeSet(exerciseId, totalSets);
  };

  const handleExerciseClick = (exercise: any, event: React.MouseEvent) => {
    if (!workoutInProgress) {
      console.log('⚠️ Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }

    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
        handleVideoClick(exercise);
      }
      return;
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-none p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Dumbbell className="h-4 w-4" />
              <span>{currentDay.name || `Ημέρα ${currentDay.day_number}`}</span>
            </h4>
          </div>
          {currentDay.estimated_duration_minutes && (
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Clock className="h-3 w-3" />
              <span>{currentDay.estimated_duration_minutes} λεπτά</span>
            </div>
          )}
        </div>

        <ExerciseInteractionHandler
          workoutInProgress={workoutInProgress}
          onVideoClick={handleVideoClick}
          onSetClick={handleSetClick}
        >
          <ProgramBlocks
            blocks={currentDay.program_blocks}
            workoutInProgress={workoutInProgress}
            getRemainingText={exerciseCompletion.getRemainingText}
            isExerciseComplete={exerciseCompletion.isExerciseComplete}
            onExerciseClick={handleExerciseClick}
            onSetClick={handleSetClick}
            onVideoClick={handleVideoClick}
            getNotes={exerciseCompletion.getNotes}
            updateNotes={exerciseCompletion.updateNotes}
            clearNotes={exerciseCompletion.clearNotes}
            updateKg={exerciseCompletion.updateKg}
            clearKg={exerciseCompletion.clearKg}
            updateVelocity={exerciseCompletion.updateVelocity}
            clearVelocity={exerciseCompletion.clearVelocity}
            updateReps={exerciseCompletion.updateReps}
            clearReps={exerciseCompletion.clearReps}
            selectedDate={new Date()}
            program={assignment}
          />
        </ExerciseInteractionHandler>
      </div>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
