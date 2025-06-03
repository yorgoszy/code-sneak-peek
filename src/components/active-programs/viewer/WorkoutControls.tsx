
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Play, Square } from "lucide-react";

interface WorkoutControlsProps {
  mode: 'view' | 'start';
  isWorkoutActive: boolean;
  loading: boolean;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onStopWorkout: () => void;
}

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  mode,
  isWorkoutActive,
  loading,
  onStartWorkout,
  onCompleteWorkout,
  onStopWorkout
}) => {
  if (mode !== 'start') return null;

  return (
    <div className="pt-4 border-t space-y-3 mt-4">
      {!isWorkoutActive ? (
        <Button 
          onClick={onStartWorkout}
          className="w-full rounded-none"
        >
          <Play className="w-4 h-4 mr-2" />
          Έναρξη Προπονήσης
        </Button>
      ) : (
        <div className="space-y-2">
          <Button 
            onClick={onCompleteWorkout}
            disabled={loading}
            className="w-full rounded-none"
          >
            {loading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Ολοκλήρωση...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ολοκλήρωση Προπονήσης
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={onStopWorkout}
            className="w-full rounded-none"
          >
            <Square className="w-4 h-4 mr-2" />
            Διακοπή Προπονήσης
          </Button>
        </div>
      )}
    </div>
  );
};
