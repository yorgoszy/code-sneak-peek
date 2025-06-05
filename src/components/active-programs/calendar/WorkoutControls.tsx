
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, X } from 'lucide-react';

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
  if (workoutStatus === 'completed') {
    return null;
  }

  if (!workoutInProgress) {
    return (
      <Button
        onClick={onStartWorkout}
        className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        size="sm"
      >
        <Play className="w-4 h-4 mr-2" />
        Έναρξη Προπόνησης
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onCompleteWorkout}
        className="bg-green-600 hover:bg-green-700 text-white rounded-none"
        size="sm"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Ολοκλήρωση
      </Button>
      <Button
        onClick={onCancelWorkout}
        variant="outline"
        className="rounded-none"
        size="sm"
      >
        <X className="w-4 h-4 mr-2" />
        Ακύρωση
      </Button>
    </div>
  );
};
