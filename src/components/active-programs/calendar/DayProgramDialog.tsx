import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { isValidVideoUrl } from '@/utils/videoUtils';
import { ExerciseVideoDialog } from '@/components/user-profile/daily-program/ExerciseVideoDialog';
import { useExerciseCompletion } from '@/hooks/useExerciseCompletion';
import { WorkoutTimer } from './WorkoutTimer';
import { WorkoutControls } from './WorkoutControls';
import { ProgramInfo } from './ProgramInfo';
import { ProgramBlocks } from './ProgramBlocks';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: EnrichedAssignment | null;
  selectedDate: Date | null;
  workoutStatus: string;
}

export const DayProgramDialog: React.FC<DayProgramDialogProps> = ({
  isOpen,
  onClose,
  program,
  selectedDate,
  workoutStatus
}) => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { 
    completeSet, 
    getRemainingText, 
    isExerciseComplete,
    updateNotes,
    clearNotes,
    getNotes,
    updateKg,
    clearKg,
    updateVelocity,
    clearVelocity,
    updateReps,
    clearReps,
    getAdjustments
  } = useExerciseCompletion();

  // Χρονόμετρο
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutInProgress && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutInProgress, startTime]);

  if (!program || !selectedDate) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'makeup':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ολοκληρωμένη';
      case 'missed':
        return 'Χαμένη';
      case 'makeup':
        return 'Αναπλήρωση';
      default:
        return 'Προγραμματισμένη';
    }
  };

  const handleStartWorkout = () => {
    console.log('🏋️‍♂️ Έναρξη προπόνησης για ημερομηνία:', format(selectedDate, 'dd/MM/yyyy'));
    console.log('📋 Program ID:', program.id);
    console.log('👤 User:', program.app_users?.name);
    
    setWorkoutInProgress(true);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const handleCompleteWorkout = () => {
    console.log('✅ Ολοκλήρωση προπόνησης');
    console.log('⏱️ Συνολικός χρόνος:', elapsedTime);
    
    setWorkoutInProgress(false);
    setStartTime(null);
    setElapsedTime(0);
    // Εδώ θα μπορούσαμε να αποθηκεύσουμε τα δεδομένα της προπόνησης
  };

  const handleCancelWorkout = () => {
    console.log('❌ Ακύρωση προπόνησης');
    
    setWorkoutInProgress(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  const handleExerciseClick = (exercise: any, event: React.MouseEvent) => {
    // Αν δεν έχει ξεκινήσει η προπόνηση, δεν επιτρέπουμε κλικ στις ασκήσεις
    if (!workoutInProgress) {
      console.log('⚠️ Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }

    // Αν κλικάρουμε στο video thumbnail, ανοίγει το video
    if ((event.target as HTMLElement).closest('.video-thumbnail')) {
      if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
        setSelectedExercise(exercise);
        setIsVideoDialogOpen(true);
      }
      return;
    }
  };

  const handleSetClick = (exerciseId: string, totalSets: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Αν δεν έχει ξεκινήσει η προπόνηση, δεν επιτρέπουμε κλικ στα sets
    if (!workoutInProgress) {
      console.log('⚠️ Πρέπει να ξεκινήσεις την προπόνηση πρώτα!');
      return;
    }

    // Ολοκληρώνουμε ένα σετ
    completeSet(exerciseId, totalSets);
  };

  const handleVideoClick = (exercise: any) => {
    if (exercise.exercises?.video_url && isValidVideoUrl(exercise.exercises.video_url)) {
      setSelectedExercise(exercise);
      setIsVideoDialogOpen(true);
    }
  };

  // Βρίσκουμε την σωστή ημέρα βάσει των training_dates
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const trainingDates = program.training_dates || [];
  const dateIndex = trainingDates.findIndex(date => date === selectedDateStr);
  
  console.log('🔍 Looking for training day:', selectedDateStr);
  console.log('📅 Available training dates:', trainingDates);
  console.log('📍 Date index found:', dateIndex);

  let dayProgram = null;
  if (dateIndex >= 0 && program.programs?.program_weeks?.[0]?.program_days) {
    const programDays = program.programs.program_weeks[0].program_days;
    dayProgram = programDays[dateIndex % programDays.length];
    console.log('✅ Found day program:', dayProgram?.name);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Πρόγραμμα Προπόνησης - {format(selectedDate, 'dd MMMM yyyy', { locale: el })}
              </span>
              <div className="flex items-center gap-2">
                <WorkoutTimer
                  workoutInProgress={workoutInProgress}
                  elapsedTime={elapsedTime}
                />
                
                <WorkoutControls
                  workoutInProgress={workoutInProgress}
                  workoutStatus={workoutStatus}
                  onStartWorkout={handleStartWorkout}
                  onCompleteWorkout={handleCompleteWorkout}
                  onCancelWorkout={handleCancelWorkout}
                />
                
                <Badge className={`rounded-none ${getStatusBadgeColor(workoutStatus)}`}>
                  {getStatusText(workoutStatus)}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <ProgramInfo
              program={program}
              dayProgram={dayProgram}
              workoutInProgress={workoutInProgress}
              workoutStatus={workoutStatus}
            />

            {/* Πρόγραμμα Ημέρας */}
            {dayProgram ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                  <span>{dayProgram.name}</span>
                </h4>

                <ProgramBlocks
                  blocks={dayProgram.program_blocks}
                  workoutInProgress={workoutInProgress}
                  getRemainingText={getRemainingText}
                  isExerciseComplete={isExerciseComplete}
                  onExerciseClick={handleExerciseClick}
                  onSetClick={handleSetClick}
                  onVideoClick={handleVideoClick}
                  getNotes={getNotes}
                  updateNotes={updateNotes}
                  clearNotes={clearNotes}
                  updateKg={updateKg}
                  clearKg={clearKg}
                  updateVelocity={updateVelocity}
                  clearVelocity={clearVelocity}
                  updateReps={updateReps}
                  clearReps={clearReps}
                />
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
