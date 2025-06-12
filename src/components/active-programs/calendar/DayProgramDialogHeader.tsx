
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Play, Square, CheckCircle, X } from "lucide-react";
import { WorkoutTimer } from "./WorkoutTimer";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramDialogHeaderProps {
  selectedDate: Date;
  workoutInProgress: boolean;
  elapsedTime: number;
  workoutStatus: string;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
  onMinimize?: () => void;
  program: EnrichedAssignment;
}

export const DayProgramDialogHeader: React.FC<DayProgramDialogHeaderProps> = ({
  selectedDate,
  workoutInProgress,
  elapsedTime,
  workoutStatus,
  onStartWorkout,
  onCompleteWorkout,
  onCancelWorkout,
  onMinimize,
  program
}) => {
  const isCompleted = workoutStatus === 'completed';

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {program.app_users?.name || 'Άγνωστος Αθλητής'}
          </h2>
          <p className="text-sm text-gray-600">
            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: el })}
          </p>
        </div>
        
        {workoutInProgress && (
          <WorkoutTimer elapsedTime={elapsedTime} />
        )}
      </div>

      <div className="flex items-center space-x-2">
        {isCompleted ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 rounded-none">
            Ολοκληρωμένη
          </Badge>
        ) : workoutInProgress ? (
          <>
            <Button
              onClick={onCompleteWorkout}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Ολοκλήρωση
            </Button>
            <Button
              onClick={onCancelWorkout}
              variant="outline"
              className="rounded-none"
            >
              <X className="w-4 h-4 mr-2" />
              Ακύρωση
            </Button>
          </>
        ) : (
          <Button
            onClick={onStartWorkout}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Play className="w-4 h-4 mr-2" />
            Έναρξη
          </Button>
        )}
      </div>
    </div>
  );
};
