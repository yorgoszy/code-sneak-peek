
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useWorkoutState } from './hooks/useWorkoutState';
import { DayProgramDialogHeader } from './DayProgramDialogHeader';
import { ExerciseInteractionHandler } from './ExerciseInteractionHandler';
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

  // Helper functions for shared notes props
  const getDayNumber = (exerciseId: string) => {
    if (!program?.programs?.program_weeks?.[0]?.program_days) return 1;
    
    for (let dayIndex = 0; dayIndex < program.programs.program_weeks[0].program_days.length; dayIndex++) { 
      const day = program.programs.program_weeks[0].program_days[dayIndex];
      const hasExercise = day.program_blocks?.some(block => 
        block.program_exercises?.some(ex => ex.id === exerciseId)
      );
      if (hasExercise) {
        return dayIndex + 1; // Convert to 1-based index
      }
    }
    return 1;
  };

  const getActualExerciseId = (programExerciseId: string) => {
    if (!program?.programs?.program_weeks?.[0]?.program_days) return undefined;
    
    for (const day of program.programs.program_weeks[0].program_days) {
      for (const block of day.program_blocks || []) {
        for (const exercise of block.program_exercises || []) {
          if (exercise.id === programExerciseId) {
            return exercise.exercise_id; // This is the reference to exercises table
          }
        }
      }
    }
    return undefined;
  };

  // ΔΙΟΡΘΩΣΗ: Σωστή λογική εύρεσης προγράμματος ημέρας που υποστηρίζει πολλαπλές εβδομάδες
  const getDayProgram = () => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const trainingDates = program.training_dates || [];
    const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
    
    console.log('🔍 DayProgram search:', {
      selectedDateStr,
      dateIndex,
      trainingDatesLength: trainingDates.length,
      programName: program.programs?.name
    });
    
    if (dateIndex === -1) {
      console.log('❌ Date not found in training dates');
      return null;
    }

    const weeks = program.programs?.program_weeks || [];
    if (weeks.length === 0) {
      console.log('❌ No weeks found');
      return null;
    }

    // Υπολογίζουμε σε ποια εβδομάδα και ποια ημέρα αντιστοιχεί το dateIndex
    const sortedWeeks = [...weeks].sort((a, b) => (a.week_number || 0) - (b.week_number || 0));
    
    let cumulativeDays = 0;
    for (const week of sortedWeeks) {
      const sortedDays = [...(week.program_days || [])].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
      const daysInWeek = sortedDays.length;
      
      // Αν το dateIndex βρίσκεται σε αυτή την εβδομάδα
      if (dateIndex < cumulativeDays + daysInWeek) {
        const dayIndexInWeek = dateIndex - cumulativeDays;
        const dayProgram = sortedDays[dayIndexInWeek];
        
        console.log('✅ Found program:', {
          weekName: week.name,
          weekNumber: week.week_number,
          dayName: dayProgram?.name,
          dayNumber: dayProgram?.day_number,
          dayIndexInWeek,
          cumulativeDays,
          blocksCount: dayProgram?.program_blocks?.length
        });
        
        return dayProgram;
      }
      
      cumulativeDays += daysInWeek;
    }

    console.log('❌ Day program not found after iterating all weeks');
    return null;
  };

  const dayProgram = getDayProgram();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[85vh] overflow-hidden rounded-none p-3 flex flex-col">
          <DayProgramDialogHeader
            selectedDate={selectedDate}
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime}
            workoutStatus={workoutStatus}
            onStartWorkout={handleStartWorkout}
            onCompleteWorkout={handleCompleteWorkout}
            onCancelWorkout={handleCancelWorkout}
            program={program}
            onClose={onClose}
          />

          <div className="pt-12 pb-2 overflow-y-auto flex-1 space-y-2">
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
                    getCompletedSets={exerciseCompletion.getCompletedSets}
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
        getNotes={exerciseCompletion.getNotes}
        updateNotes={exerciseCompletion.updateNotes}
        clearNotes={exerciseCompletion.clearNotes}
        assignmentId={program?.id}
        dayNumber={selectedExercise ? getDayNumber(selectedExercise.id) : undefined}
        actualExerciseId={selectedExercise ? getActualExerciseId(selectedExercise.id) : undefined}
      />
    </>
  );
};
