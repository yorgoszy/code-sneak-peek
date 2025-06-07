
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    console.log('🎬 Video click for exercise:', exercise);
    // Χρησιμοποιούμε το σωστό path για το video URL
    const videoUrl = exercise.exercises?.video_url;
    console.log('🎬 Video URL found:', videoUrl);
    
    if (videoUrl && isValidVideoUrl(videoUrl)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    } else {
      console.log('❌ No valid video URL found for exercise');
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
      handleVideoClick(exercise);
      return;
    }
  };

  const handleMinimize = () => {
    console.log('📱 Minimizing to sidebar...');
    if (onMinimize) {
      onMinimize();
    }
    onClose();
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

  const blocks = dayProgram?.program_blocks || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[50vh] overflow-y-auto rounded-none">
          <DayProgramDialogHeader
            selectedDate={selectedDate}
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime}
            workoutStatus={workoutStatus}
            onStartWorkout={handleStartWorkout}
            onCompleteWorkout={handleCompleteWorkout}
            onCancelWorkout={handleCancelWorkout}
            onMinimize={handleMinimize}
          />

          <div className="space-y-0.5">
            {/* Program Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-none p-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate">{program.programs?.name}</span>
                {dayProgram && <span className="text-gray-600 truncate">• {dayProgram.name}</span>}
              </div>
            </div>

            {blocks.length > 0 ? (
              <Tabs defaultValue="0" className="w-full">
                <TabsList className="grid w-full rounded-none h-6" style={{ gridTemplateColumns: `repeat(${blocks.length}, 1fr)` }}>
                  {blocks.map((block, index) => (
                    <TabsTrigger 
                      key={block.id} 
                      value={index.toString()} 
                      className="rounded-none text-xs py-0.5 px-1 h-5"
                    >
                      {block.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {blocks.map((block, blockIndex) => (
                  <TabsContent key={block.id} value={blockIndex.toString()} className="mt-0.5">
                    <div className="space-y-0.5">
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
                          selectedDate={selectedDate}
                          program={program}
                        />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="bg-white border border-gray-200 rounded-none p-3 text-center text-gray-500 text-xs">
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
