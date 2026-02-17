// DayProgramDialog - v2
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useWorkoutState } from './hooks/useWorkoutState';
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { DayProgramDialogHeader } from './DayProgramDialogHeader';
import { ExerciseInteractionHandler } from './ExerciseInteractionHandler';
import { ProgramBlocks } from './ProgramBlocks';
import { RpeScoreDialog } from './RpeScoreDialog';
import { useMinimizedBubbles } from '@/contexts/MinimizedBubblesContext';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: EnrichedAssignment | null;
  selectedDate: Date | null;
  workoutStatus: string;
  onRefresh?: () => void;
  onMinimize?: () => void;
}

export const DayProgramDialog: React.FC<DayProgramDialogProps> = ({
  isOpen,
  onClose,
  program,
  selectedDate,
  workoutStatus,
  onRefresh,
  onMinimize
}) => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isRpeDialogOpen, setIsRpeDialogOpen] = useState(false);
  const [currentRpeScore, setCurrentRpeScore] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const bubbleIdRef = useRef<string>('');
  
  const { addBubble, removeBubble, updateBubble } = useMinimizedBubbles();
  const { getWorkoutCompletions } = useWorkoutCompletions();

  const {
    workoutInProgress,
    elapsedTime,
    handleStartWorkout,
    handleCompleteWorkout,
    handleCancelWorkout,
    exerciseCompletion
  } = useWorkoutState(program, selectedDate, onRefresh, onClose);

  // Fetch RPE score for completed workout
  useEffect(() => {
    const fetchRpeScore = async () => {
      if (!program?.id || !selectedDate) return;
      
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      const completions = await getWorkoutCompletions(program.id);
      const completion = completions.find(c => 
        c.scheduled_date === selectedDateStr && 
        c.status === 'completed'
      );
      
      setCurrentRpeScore(completion?.rpe_score ?? null);
    };
    
    fetchRpeScore();
  }, [program?.id, selectedDate, workoutStatus]);

  // Keep bubble elapsed time in sync
  useEffect(() => {
    if (isMinimized && bubbleIdRef.current) {
      updateBubble(bubbleIdRef.current, { elapsedTime, workoutInProgress });
    }
  }, [elapsedTime, workoutInProgress, isMinimized, updateBubble]);

  // Cleanup bubble on unmount
  useEffect(() => {
    return () => {
      if (bubbleIdRef.current) {
        removeBubble(bubbleIdRef.current);
      }
    };
  }, [removeBubble]);

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

    const allProgramDays = (program.programs?.program_weeks || [])
      .slice()
      .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0))
      .flatMap((w: any) =>
        (w.program_days || []).slice().sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0))
      );

    const cycleLength = allProgramDays.length || 1;
    return (dateIndex % cycleLength) + 1;
  };

  const getActualExerciseId = (exercise: any) => {
    // Προσπάθησε να πάρεις το exercise_id (FK στον πίνακα exercises)
    if (exercise?.exercise_id) return exercise.exercise_id;
    if (exercise?.exercises?.id) return exercise.exercises.id;
    return undefined;
  };

  // Βρες το day program κάνοντας cycle πάνω σε όλες τις ημέρες του προγράμματος
  const getDayProgram = () => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const trainingDates = program.training_dates || [];
    const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);

    if (dateIndex === -1) return null;

    const allProgramDays = (program.programs?.program_weeks || [])
      .slice()
      .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0))
      .flatMap((w: any) =>
        (w.program_days || []).slice().sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0))
      );

    if (allProgramDays.length === 0) return null;

    const idx = dateIndex % allProgramDays.length;
    return allProgramDays[idx] || null;
  };

  const dayProgram = getDayProgram();
  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      const id = `bubble-${program.id}-${format(selectedDate, 'yyyy-MM-dd')}`;
      bubbleIdRef.current = id;
      setIsMinimized(true);
      addBubble({
        id,
        athleteName: program.app_users?.name || 'Αθλητής',
        avatarUrl: program.app_users?.avatar_url,
        photoUrl: program.app_users?.photo_url,
        workoutInProgress,
        elapsedTime,
        onRestore: () => {
          setIsMinimized(false);
          removeBubble(id);
        },
      });
    }
  };


  if (isMinimized) {
    return (
      <>
        <RpeScoreDialog
          isOpen={isRpeDialogOpen}
          onClose={() => setIsRpeDialogOpen(false)}
          onSubmit={handleRpeSubmit}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md h-[85vh] overflow-hidden rounded-none p-3 flex flex-col">
          <DayProgramDialogHeader
            selectedDate={selectedDate}
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime}
            workoutStatus={workoutStatus}
            rpeScore={currentRpeScore}
            onStartWorkout={handleStartWorkout}
            onCompleteWorkout={handleRequestComplete}
            onCancelWorkout={handleCancelWorkout}
            onMinimize={handleMinimize}
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
