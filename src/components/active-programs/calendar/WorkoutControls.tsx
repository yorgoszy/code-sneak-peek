
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, X } from 'lucide-react';

interface WorkoutControlsProps {
  workoutInProgress: boolean;
  workoutStatus: string;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
  isEmbedded?: boolean;
}

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  workoutInProgress,
  workoutStatus,
  onStartWorkout,
  onCompleteWorkout,
  onCancelWorkout,
  isEmbedded = false
}) => {
  const buttonBaseClass = isEmbedded 
    ? "rounded-none text-white border-white hover:bg-white hover:text-black"
    : "rounded-none";

  if (workoutInProgress) {
    return (
      <div className="flex space-x-2">
        <Button
          onClick={onCompleteWorkout}
          className={`bg-[#00ffba] hover:bg-[#00ffba]/90 text-black ${buttonBaseClass}`}
          size="sm"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Ολοκλήρωση
        </Button>
        <Button
          onClick={onCancelWorkout}
          variant="outline"
          className={buttonBaseClass}
          size="sm"
        >
          <X className="w-4 h-4 mr-2" />
          Ακύρωση
        </Button>
      </div>
    );
  }

  if (workoutStatus === 'completed') {
    return (
      <div className={`text-xs font-medium flex items-center space-x-2 ${
        isEmbedded ? 'text-[#00ffba]' : 'text-green-600'
      }`}>
        <CheckCircle className="w-4 h-4" />
        <span>Προπόνηση ολοκληρωμένη</span>
      </div>
    );
  }

  return (
    <Button
      onClick={onStartWorkout}
      className={`bg-[#00ffba] hover:bg-[#00ffba]/90 text-black ${buttonBaseClass}`}
      size="sm"
    >
      <Play className="w-4 h-4 mr-2" />
      Έναρξη Προπόνησης
    </Button>
  );
};
