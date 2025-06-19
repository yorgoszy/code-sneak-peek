
import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useWorkoutState } from './hooks/useWorkoutState';
import { DayProgramDialogHeader } from './DayProgramDialogHeader';
import { DayProgramStatusIndicator } from './DayProgramStatusIndicator';
import { DayProgramMainContent } from './DayProgramMainContent';
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramDialogContentProps {
  program: EnrichedAssignment;
  selectedDate: Date;
  workoutStatus: string;
  onRefresh?: () => void;
  onMinimize?: () => void;
}

export const DayProgramDialogContent: React.FC<DayProgramDialogContentProps> = ({
  program,
  selectedDate,
  workoutStatus,
  onRefresh,
  onMinimize
}) => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [dynamicStatus, setDynamicStatus] = useState<string>(workoutStatus);
  const [statusLoading, setStatusLoading] = useState(false);

  const {
    workoutInProgress,
    elapsedTime,
    handleStartWorkout,
    handleCompleteWorkout,
    handleCancelWorkout,
    exerciseCompletion
  } = useWorkoutState(program, selectedDate, onRefresh);

  // Fetch current completion status when dialog opens or date/assignment changes
  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      setDynamicStatus(workoutStatus);
      if (!program?.id || !selectedDate) {
        setStatusLoading(false);
        return;
      }
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('workout_completions')
        .select('status')
        .eq('assignment_id', program.id)
        .eq('scheduled_date', dateStr)
        .maybeSingle();

      if (error) {
        setDynamicStatus(workoutStatus);
      } else if (data?.status) {
        setDynamicStatus(data.status);
      } else {
        setDynamicStatus(workoutStatus);
      }
      setStatusLoading(false);
    };

    fetchStatus();
  }, [program?.id, selectedDate, workoutStatus]);

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
      <DayProgramDialogHeader
        selectedDate={selectedDate}
        workoutInProgress={workoutInProgress}
        elapsedTime={elapsedTime}
        workoutStatus={dynamicStatus}
        onStartWorkout={handleStartWorkout}
        onCompleteWorkout={handleCompleteWorkout}
        onCancelWorkout={handleCancelWorkout}
        onMinimize={onMinimize}
        program={program}
      />

      <div className="space-y-2 md:space-y-4">
        <DayProgramStatusIndicator statusLoading={statusLoading} />

        <DayProgramMainContent
          program={program}
          dayProgram={dayProgram}
          workoutInProgress={workoutInProgress}
          dynamicStatus={dynamicStatus}
          selectedDate={selectedDate}
          exerciseCompletion={exerciseCompletion}
          onExerciseClick={handleExerciseClick}
          onSetClick={handleSetClick}
          onVideoClick={handleVideoClick}
        />
      </div>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
      />
    </>
  );
};
