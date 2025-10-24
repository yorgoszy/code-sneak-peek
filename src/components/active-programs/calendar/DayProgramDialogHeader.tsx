
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
  onClose: () => void;
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
  program,
  onClose
}) => {
  const isCompleted = workoutStatus === 'completed';

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 p-2">
      <div className="flex items-center justify-between gap-4">
        {/* Όνομα χρήστη και ημερομηνία */}
        <div className="text-left min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            {program.app_users?.name || 'Άγνωστος Αθλητής'}
          </h2>
          <p className="text-xs text-gray-600">
            {format(selectedDate, 'EEEE, d/M/yyyy', { locale: el })}
          </p>
        </div>
        
        {/* Timer */}
        <div className="flex-shrink-0">
          <WorkoutTimer 
            workoutInProgress={workoutInProgress}
            elapsedTime={elapsedTime} 
          />
        </div>

        {/* Κουμπιά ελέγχου */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted ? (
            <>
              <Badge className="bg-green-100 text-green-800 border-green-200 rounded-none text-xs px-2 py-0.5">
                Ολοκληρωμένη
              </Badge>
              <button
                onClick={onClose}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3"
              >
                <X className="w-3 h-3" />
                Κλείσιμο
              </button>
            </>
          ) : workoutInProgress ? (
            <>
              <button
                onClick={onCompleteWorkout}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3"
              >
                <CheckCircle className="w-3 h-3" />
                Ολοκλήρωση
              </button>
              <button
                onClick={onCancelWorkout}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3"
              >
                <X className="w-3 h-3" />
                Ακύρωση
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStartWorkout}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3"
              >
                <Play className="w-3 h-3" />
                Έναρξη
              </button>
              <button
                onClick={onClose}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3"
              >
                <X className="w-3 h-3" />
                Κλείσιμο
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
