
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
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 p-4 space-y-3">
      {/* Όνομα χρήστη - τέρμα πάνω */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {program.app_users?.name || 'Άγνωστος Αθλητής'}
        </h2>
      </div>

      {/* Κουμπιά ελέγχου - από κάτω */}
      <div className="flex items-center justify-center gap-2">
        <WorkoutTimer 
          workoutInProgress={workoutInProgress}
          elapsedTime={elapsedTime} 
        />
        
        {isCompleted ? (
          <Badge className="bg-green-100 text-green-800 border-green-200 rounded-none text-sm px-3 py-1">
            Ολοκληρωμένη
          </Badge>
        ) : workoutInProgress ? (
          <div className="flex gap-2">
            <button
              onClick={onCompleteWorkout}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
            >
              <CheckCircle className="w-4 h-4" />
              Ολοκλήρωση
            </button>
            <button
              onClick={onCancelWorkout}
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
            >
              <X className="w-4 h-4" />
              Ακύρωση
            </button>
          </div>
        ) : (
          <button
            onClick={onStartWorkout}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
          >
            <Play className="w-4 h-4" />
            Έναρξη
          </button>
        )}
      </div>

      {/* Ημερομηνία - από κάτω */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: el })}
        </p>
      </div>
    </div>
  );
};
