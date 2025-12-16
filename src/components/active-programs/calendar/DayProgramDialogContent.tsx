
import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useWorkoutState } from './hooks/useWorkoutState';
import { DayProgramDialogHeader } from './DayProgramDialogHeader';
import { DayProgramStatusIndicator } from './DayProgramStatusIndicator';
import { DayProgramMainContent } from './DayProgramMainContent';
import { RpeScoreDialog } from './RpeScoreDialog';
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramDialogContentProps {
  program: EnrichedAssignment;
  selectedDate: Date;
  workoutStatus: string;
  onRefresh?: () => void;
  onMinimize?: () => void;
  onClose: () => void;
}

export const DayProgramDialogContent: React.FC<DayProgramDialogContentProps> = ({
  program,
  selectedDate,
  workoutStatus,
  onRefresh,
  onMinimize,
  onClose
}) => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isRpeDialogOpen, setIsRpeDialogOpen] = useState(false);
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

  const handleRequestComplete = () => {
    setIsRpeDialogOpen(true);
  };

  const handleRpeSubmit = (rpeScore: number) => {
    setIsRpeDialogOpen(false);
    handleCompleteWorkout(rpeScore);
  };

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
    console.log('🎬 DayProgramDialogContent - Full exercise object:', exercise);
    console.log('🎬 DayProgramDialogContent - Exercise structure:', {
      id: exercise.id,
      exercise_id: exercise.exercise_id,
      exercises: exercise.exercises,
      'exercises?.video_url': exercise.exercises?.video_url,
      'Direct video_url': exercise.video_url
    });
    
    // Δοκιμάζω διαφορετικές διαδρομές για το video URL
    let videoUrl = null;
    
    if (exercise.exercises?.video_url) {
      videoUrl = exercise.exercises.video_url;
      console.log('✅ Found video URL in exercises.video_url:', videoUrl);
    } else if (exercise.video_url) {
      videoUrl = exercise.video_url;
      console.log('✅ Found video URL in direct video_url:', videoUrl);
    }
    
    console.log('🎬 Final video URL to check:', videoUrl);
    console.log('🎬 Is valid video URL:', videoUrl ? isValidVideoUrl(videoUrl) : false);
    
    if (videoUrl && isValidVideoUrl(videoUrl)) {
      console.log('✅ DayProgramDialogContent - Opening video dialog');
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    } else {
      console.log('❌ DayProgramDialogContent - No valid video URL found for exercise');
    }
  };

  const handleSetClick = (exerciseId: string, totalSets: number, event: React.MouseEvent) => {
    console.log('🎯 DayProgramDialogContent - Set click for exercise:', exerciseId);
    exerciseCompletion.completeSet(exerciseId, totalSets);
  };

  // Find the correct day program
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const trainingDates = program.training_dates || [];
  const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
  
  let dayProgram = null;
  let dayNumber = 1;
  if (dateIndex >= 0 && program.programs?.program_weeks?.[0]?.program_days) {
    const programDays = program.programs.program_weeks[0].program_days;
    dayProgram = programDays[dateIndex % programDays.length];
    dayNumber = (dateIndex % programDays.length) + 1;
  }

  return (
    <>
      <DayProgramDialogHeader
        selectedDate={selectedDate}
        workoutInProgress={workoutInProgress}
        elapsedTime={elapsedTime}
        workoutStatus={dynamicStatus}
        onStartWorkout={handleStartWorkout}
        onCompleteWorkout={handleRequestComplete}
        onCancelWorkout={handleCancelWorkout}
        onMinimize={onMinimize}
        program={program}
        onClose={onClose}
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
          onSetClick={handleSetClick}
          onVideoClick={handleVideoClick}
        />
      </div>

      <ExerciseVideoDialog
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
        exercise={selectedExercise}
        assignmentId={program.id}
        dayNumber={dayNumber}
        actualExerciseId={selectedExercise?.exercises?.id}
      />

      <RpeScoreDialog
        isOpen={isRpeDialogOpen}
        onClose={() => setIsRpeDialogOpen(false)}
        onSubmit={handleRpeSubmit}
      />
    </>
  );
};
