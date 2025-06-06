
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
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
}

export const DayProgramDialogHeader: React.FC<DayProgramDialogHeaderProps> = ({
  selectedDate,
  workoutInProgress,
  elapsedTime,
  workoutStatus,
  onStartWorkout,
  onCompleteWorkout,
  onCancelWorkout
}) => {
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

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <span>
          {format(selectedDate, 'EEEE', { locale: el })} - {format(selectedDate, 'dd MMMM yyyy', { locale: el })}
        </span>
        <div className="flex items-center gap-2">
          <WorkoutTimer
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime}
          />
          
          <WorkoutControls
            workoutInProgress={workoutInProgress}
            workoutStatus={workoutStatus}
            onStartWorkout={onStartWorkout}
            onCompleteWorkout={onCompleteWorkout}
            onCancelWorkout={onCancelWorkout}
          />
          
          <Badge className={`rounded-none ${getStatusBadgeColor(workoutStatus)}`}>
            {getStatusText(workoutStatus)}
          </Badge>
        </div>
      </DialogTitle>
    </DialogHeader>
  );
};
