
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useWorkoutState } from './hooks/useWorkoutState';
import { DayProgramDialogHeader } from './DayProgramDialogHeader';
import { ExerciseInteractionHandler } from './ExerciseInteractionHandler';
import { ProgramBlocks } from './ProgramBlocks';
import { RpeScoreDialog } from './RpeScoreDialog';
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
  const [isRpeDialogOpen, setIsRpeDialogOpen] = useState(false);

  const {
    workoutInProgress,
    elapsedTime,
    handleStartWorkout,
    handleCompleteWorkout,
    handleCancelWorkout,
    exerciseCompletion
  } = useWorkoutState(program, selectedDate, onRefresh, onClose);

  if (!program || !selectedDate) return null;

  const handleRequestComplete = () => {
    setIsRpeDialogOpen(true);
  };

  const handleRpeSubmit = (rpeScore: number) => {
    setIsRpeDialogOpen(false);
    handleCompleteWorkout(rpeScore);
  };

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

  // Helper function to get current day number based on selected date
  const getDayNumber = (exerciseId: string) => {
    if (!program?.training_dates || !selectedDate) return 1;
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateIndex = program.training_dates.findIndex(date => date === selectedDateStr);
    if (dateIndex < 0) return 1;
    
    // Calculate days per week from first week
    const daysPerWeek = program.programs?.program_weeks?.[0]?.program_days?.length || 1;
    
    // Get day number within the week (1-based)
    return (dateIndex % daysPerWeek) + 1;
  };

  const getActualExerciseId = (exercise: any) => {
    // Προσπάθησε να πάρεις το exercise_id (FK στον πίνακα exercises)
    if (exercise?.exercise_id) return exercise.exercise_id;
    if (exercise?.exercises?.id) return exercise.exercises.id;
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
            onCompleteWorkout={handleRequestComplete}
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

                {dayProgram.is_test_day ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-none p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900">Ημέρα Τεστ</h3>
                        <p className="text-sm text-purple-700">Σήμερα έχεις προγραμματισμένα τεστ</p>
                      </div>
                    </div>
                    
                    {dayProgram.test_types && dayProgram.test_types.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-purple-900">Κατηγορίες Τεστ:</p>
                        <div className="flex flex-wrap gap-2">
                          {dayProgram.test_types.map((type: string) => {
                            const labels: Record<string, string> = {
                              anthropometric: 'Ανθρωπομετρικά',
                              functional: 'Λειτουργικά',
                              endurance: 'Αντοχή',
                              jump: 'Άλματα',
                              strength: 'Δύναμη'
                            };
                            return (
                              <span key={type} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-none text-sm font-medium">
                                {labels[type] || type}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : dayProgram.is_competition_day ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-none p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-amber-900">Ημέρα Αγώνα</h3>
                        <p className="text-sm text-amber-700">Σήμερα έχεις αγώνα - Καλή επιτυχία!</p>
                      </div>
                    </div>
                  </div>
                ) : (
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
                      getKg={exerciseCompletion.getKg}
                      getReps={exerciseCompletion.getReps}
                      getVelocity={exerciseCompletion.getVelocity}
                      selectedDate={selectedDate}
                      program={program}
                    />
                  </ExerciseInteractionHandler>
                )}
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
        actualExerciseId={selectedExercise ? getActualExerciseId(selectedExercise) : undefined}
      />

      <RpeScoreDialog
        isOpen={isRpeDialogOpen}
        onClose={() => setIsRpeDialogOpen(false)}
        onSubmit={handleRpeSubmit}
      />
    </>
  );
};
