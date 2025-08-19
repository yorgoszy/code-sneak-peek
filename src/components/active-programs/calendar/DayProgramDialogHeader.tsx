
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Play, CheckCircle, X } from "lucide-react";
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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 md:mb-4 gap-2 md:gap-4">
      <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm md:text-lg lg:text-xl font-semibold text-gray-900 truncate">
            {program.app_users?.name || 'Άγνωστος Αθλητής'}
          </h2>
          <p className="text-xs md:text-sm text-gray-600 truncate">
            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: el })}
          </p>
        </div>
        
        <WorkoutTimer 
          workoutInProgress={workoutInProgress}
          elapsedTime={elapsedTime} 
        />
      </div>

      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0 w-full md:w-auto">
        {isCompleted ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 rounded-none text-xs px-1 md:px-2 py-0.5">
            Ολοκληρωμένη
          </Badge>
        ) : workoutInProgress ? (
          <div className="flex gap-1 md:gap-2 w-full md:w-auto">
            <button
              onClick={onCompleteWorkout}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none inline-flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap text-xs md:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 md:h-10 px-2 md:px-4 py-1 md:py-2 flex-1 md:flex-none"
            >
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Ολοκλήρωση</span>
            </button>
            <button
              onClick={onCancelWorkout}
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none inline-flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap text-xs md:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 md:h-10 px-2 md:px-4 py-1 md:py-2 flex-1 md:flex-none"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Ακύρωση</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onStartWorkout}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none inline-flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap text-xs md:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 md:h-10 px-2 md:px-4 py-1 md:py-2 w-full md:w-auto"
          >
            <Play className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden md:inline">Έναρξη</span>
          </button>
        )}
      </div>
    </div>
  );
};
