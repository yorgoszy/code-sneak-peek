
import React from 'react';
import { format } from "date-fns";
import { DialogTitle } from "@/components/ui/dialog";
import { WorkoutTimer } from './WorkoutTimer';
import { WorkoutControls } from './WorkoutControls';

interface DayProgramDialogHeaderProps {
  selectedDate: Date;
  workoutInProgress: boolean;
  elapsedTime: number;
  workoutStatus: string;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
  isEmbedded?: boolean;
}

export const DayProgramDialogHeader: React.FC<DayProgramDialogHeaderProps> = ({
  selectedDate,
  workoutInProgress,
  elapsedTime,
  workoutStatus,
  onStartWorkout,
  onCompleteWorkout,
  onCancelWorkout,
  isEmbedded = false
}) => {
  const title = `Πρόγραμμα για ${format(selectedDate, 'dd/MM/yyyy')}`;

  return (
    <div className="space-y-2">
      {isEmbedded ? (
        <h2 className="text-lg font-semibold leading-none tracking-tight text-white">
          {title}
        </h2>
      ) : (
        <DialogTitle>{title}</DialogTitle>
      )}
      
      {workoutInProgress && (
        <WorkoutTimer elapsedTime={elapsedTime} />
      )}
      
      <WorkoutControls
        workoutInProgress={workoutInProgress}
        workoutStatus={workoutStatus}
        onStartWorkout={onStartWorkout}
        onCompleteWorkout={onCompleteWorkout}
        onCancelWorkout={onCancelWorkout}
        isEmbedded={isEmbedded}
      />
    </div>
  );
};
