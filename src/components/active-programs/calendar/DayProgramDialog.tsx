
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useWorkoutState } from './hooks/useWorkoutState';
import { DayProgramDialogHeader } from './DayProgramDialogHeader';
import { CompactExerciseItem } from './CompactExerciseItem';
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-none">
          <DayProgramDialogHeader
            selectedDate={selectedDate}
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime}
            workoutStatus={workoutStatus}
            onStartWorkout={handleStartWorkout}
            onCompleteWorkout={handleCompleteWorkout}
            onCancelWorkout={handleCancelWorkout}
          />

          <div className="space-y-3">
            {/* Program Info - Compact */}
            <div className="bg-gray-50 border border-gray-200 rounded-none p-2">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{program.programs?.name}</span>
                  {dayProgram && <span className="text-gray-600 ml-2">• {dayProgram.name}</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {workoutInProgress ? 'Προπόνηση σε εξέλιξη' : workoutStatus}
                </div>
              </div>
            </div>

            {dayProgram ? (
              <div className="space-y-2">
                {dayProgram.program_blocks?.map((block) => (
                  <div key={block.id} className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-700 px-1">
                      {block.name}
                    </h4>
                    {block.program_exercises?.map((exercise) => (
                      <CompactExerciseItem
                        key={exercise.id}
                        exercise={exercise}
                        workoutInProgress={workoutInProgress}
                        isComplete={exerciseCompletion.isExerciseComplete(exercise.id, exercise.sets)}
                        remainingText={exerciseCompletion.getRemainingText(exercise.id, exercise.sets)}
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
                      />
                    ))}
                  </div>
                ))}
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
