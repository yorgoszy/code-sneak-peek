
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
}

export const DayProgramDialog: React.FC<DayProgramDialogProps> = ({
  isOpen,
  onClose,
  program,
  selectedDate,
  workoutStatus,
  onRefresh
}) => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  console.log('🔍 DayProgramDialog render:', {
    isOpen,
    program: program?.id,
    selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
    workoutStatus
  });

  const {
    workoutInProgress,
    elapsedTime,
    handleStartWorkout,
    handleCompleteWorkout,
    handleCancelWorkout,
    exerciseCompletion
  } = useWorkoutState(program, selectedDate, onRefresh, onClose);

  if (!program || !selectedDate) {
    console.log('⚠️ Missing program or selectedDate');
    return null;
  }

  const handleVideoClick = (exercise: any) => {
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    }
  };

  const handleSetClick = (exerciseId: string, totalSets: number, event: React.MouseEvent) => {
    console.log('🎯 Set clicked:', exerciseId, totalSets);
    exerciseCompletion.completeSet(exerciseId, totalSets);
  };

  const handleExerciseClick = (exercise: any, event: React.MouseEvent) => {
    console.log('🎯 Exercise clicked:', exercise.id);
    
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
  
  console.log('📅 Date mapping:', {
    selectedDateStr,
    trainingDates,
    dateIndex
  });
  
  let dayProgram = null;
  if (dateIndex >= 0 && program.programs?.program_weeks?.[0]?.program_days) {
    const programDays = program.programs.program_weeks[0].program_days;
    dayProgram = programDays[dateIndex % programDays.length];
    console.log('📋 Found day program:', dayProgram?.name);
  }

  const handleDialogClose = () => {
    console.log('🔄 Closing DayProgramDialog');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-none">
          <DayProgramDialogHeader
            selectedDate={selectedDate}
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime}
            workoutStatus={workoutStatus}
            onStartWorkout={handleStartWorkout}
            onCompleteWorkout={handleCompleteWorkout}
            onCancelWorkout={handleCancelWorkout}
          />

          <div className="space-y-4">
            <ProgramInfo
              program={program}
              dayProgram={dayProgram}
              workoutInProgress={workoutInProgress}
              workoutStatus={workoutStatus}
            />

            {dayProgram ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
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
              <div className="bg-white border border-gray-200 rounded-none p-6 text-center text-gray-500">
                Δεν βρέθηκε πρόγραμμα για αυτή την ημέρα
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
