
import React, { useState } from 'react';
import { format } from "date-fns";
import { X } from "lucide-react";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useWorkoutState } from '../active-programs/calendar/hooks/useWorkoutState';
import { DayProgramDialogHeader } from '../active-programs/calendar/DayProgramDialogHeader';
import { ExerciseInteractionHandler } from '../active-programs/calendar/ExerciseInteractionHandler';
import { ProgramInfo } from '../active-programs/calendar/ProgramInfo';
import { ProgramBlocks } from '../active-programs/calendar/ProgramBlocks';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface EmbeddedProgramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: EnrichedAssignment | null;
  selectedDate: Date | null;
  workoutStatus: string;
  onRefresh?: () => void;
}

export const EmbeddedProgramDialog: React.FC<EmbeddedProgramDialogProps> = ({
  isOpen,
  onClose,
  program,
  selectedDate,
  workoutStatus,
  onRefresh
}) => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  const {
    workoutInProgress,
    elapsedTime,
    handleStartWorkout,
    handleCompleteWorkout,
    handleCancelWorkout,
    exerciseCompletion
  } = useWorkoutState(program, selectedDate, onRefresh, onClose);

  if (!isOpen || !program || !selectedDate) return null;

  const handleVideoClick = (exercise: any) => {
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    }
  };

  const handleSetClick = (exerciseId: string, totalSets: number, event: React.MouseEvent) => {
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

  // Find the correct day program
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const trainingDates = program.training_dates || [];
  const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
  
  let dayProgram = null;
  if (dateIndex >= 0 && program.programs?.program_weeks?.[0]?.program_days) {
    const programDays = program.programs.program_weeks[0].program_days;
    dayProgram = programDays[dateIndex % programDays.length];
  }

  return (
    <>
      {/* Full screen overlay within the quadrant */}
      <div className="absolute inset-0 bg-gray-900 z-20 flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <h2 className="text-white text-sm font-medium">
              {program.programs?.name}
            </h2>
            <span className="text-gray-400 text-xs">
              {format(selectedDate, 'dd/MM/yyyy')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            <DayProgramDialogHeader
              selectedDate={selectedDate}
              workoutInProgress={workoutInProgress}
              elapsedTime={elapsedTime}
              workoutStatus={workoutStatus}
              onStartWorkout={handleStartWorkout}
              onCompleteWorkout={handleCompleteWorkout}
              onCancelWorkout={handleCancelWorkout}
            />

            <ProgramInfo
              program={program}
              dayProgram={dayProgram}
              workoutInProgress={workoutInProgress}
              workoutStatus={workoutStatus}
            />

            {dayProgram ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                  <span>{dayProgram.name}</span>
                </h4>

                <ExerciseInteractionHandler
                  workoutInProgress={workoutInProgress}
                  onVideoClick={handleVideoClick}
                  onSetClick={handleSetClick}
                >
                  <ProgramBlocks
                    blocks={dayProgram.program_blocks}
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
                    selectedDate={selectedDate}
                    program={program}
                  />
                </ExerciseInteractionHandler>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-none p-4 text-center text-gray-400">
                Δεν βρέθηκε πρόγραμμα για αυτή την ημέρα
              </div>
            )}
          </div>
        </div>
      </div>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
