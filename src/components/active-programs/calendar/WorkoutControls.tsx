
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, XCircle } from "lucide-react";

interface WorkoutControlsProps {
  workoutInProgress: boolean;
  workoutStatus: string;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
}

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  workoutInProgress,
  workoutStatus,
  onStartWorkout,
  onCompleteWorkout,
  onCancelWorkout
}) => {
  return (
    <>
      {!workoutInProgress && workoutStatus !== 'completed' && (
        <Button
          onClick={onStartWorkout}
          size="sm"
          className="rounded-none flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Έναρξη
        </Button>
      )}
      
      {workoutInProgress && (
        <>
          <Button
            onClick={onCompleteWorkout}
            size="sm"
            className="rounded-none flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            Ολοκλήρωση
          </Button>
          <Button
            onClick={onCancelWorkout}
            size="sm"
            variant="outline"
            className="rounded-none flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Ακύρωση
          </Button>
        </>
      )}
    </>
  );
};
