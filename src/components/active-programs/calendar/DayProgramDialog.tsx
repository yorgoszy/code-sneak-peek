
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogPortal } from "@/components/ui/dialog";
import { format } from "date-fns";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useWorkoutState } from './hooks/useWorkoutState';
import { DayProgramDialogHeader } from './DayProgramDialogHeader';
import { ExerciseInteractionHandler } from './ExerciseInteractionHandler';
import { ProgramInfo } from './ProgramInfo';
import { ProgramBlocks } from './ProgramBlocks';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: EnrichedAssignment | null;
  selectedDate: Date | null;
  workoutStatus: string;
  onRefresh?: () => void;
  containerId?: string;
}

export const DayProgramDialog: React.FC<DayProgramDialogProps> = ({
  isOpen,
  onClose,
  program,
  selectedDate,
  workoutStatus,
  onRefresh,
  containerId
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

  if (!program || !selectedDate) return null;

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

  // Get container element for portal
  const getContainer = () => {
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        return container;
      }
    }
    return document.body;
  };

  const DialogWrapper = containerId ? 
    ({ children }: { children: React.ReactNode }) => (
      <DialogPortal container={getContainer()}>
        <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-none max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </DialogPortal>
    ) : 
    ({ children }: { children: React.ReactNode }) => (
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto rounded-none">
        {children}
      </DialogContent>
    );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogWrapper>
          <DayProgramDialogHeader
            selectedDate={selectedDate}
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime}
            workoutStatus={workoutStatus}
            onStartWorkout={handleStartWorkout}
            onCompleteWorkout={handleCompleteWorkout}
            onCancelWorkout={handleCancelWorkout}
          />

          <div className="space-y-2">
            <ProgramInfo
              program={program}
              dayProgram={dayProgram}
              workoutInProgress={workoutInProgress}
              workoutStatus={workoutStatus}
            />

            {dayProgram ? (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-900 flex items-center space-x-2">
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
              <div className="bg-white border border-gray-200 rounded-none p-4 text-center text-gray-500 text-xs">
                Δεν βρέθηκε πρόγραμμα για αυτή την ημέρα
              </div>
            )}
          </div>
        </DialogWrapper>
      </Dialog>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
