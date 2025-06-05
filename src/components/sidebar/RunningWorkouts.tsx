
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import type { RunningWorkout } from "@/hooks/useRunningWorkouts";

interface RunningWorkoutsProps {
  runningWorkouts: RunningWorkout[];
  onCompleteWorkout: (workoutId: string) => void;
  onCancelWorkout: (workoutId: string) => void;
  formatTime: (seconds: number) => string;
  isCollapsed: boolean;
}

export const RunningWorkouts: React.FC<RunningWorkoutsProps> = ({
  runningWorkouts,
  onCompleteWorkout,
  onCancelWorkout,
  formatTime,
  isCollapsed
}) => {
  if (runningWorkouts.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-4">
      <h3 className={`text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 ${isCollapsed ? 'hidden' : ''}`}>
        Ενεργές Προπονήσεις
      </h3>
      <div className="space-y-2">
        {runningWorkouts.map((workout) => (
          <div key={workout.id} className="bg-[#00ffba]/10 border border-[#00ffba]/20 rounded-none p-2">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={workout.assignment.app_users?.photo_url || undefined} 
                  alt={workout.assignment.app_users?.name || 'User'} 
                />
                <AvatarFallback className="bg-[#00ffba] text-black text-xs">
                  {workout.assignment.app_users?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {workout.assignment.app_users?.name}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {format(workout.selectedDate, 'dd/MM', { locale: el })}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-[#00ffba]" />
                {!isCollapsed && (
                  <span className="text-xs font-mono text-[#00ffba]">
                    {formatTime(workout.elapsedTime)}
                  </span>
                )}
              </div>
            </div>
            
            {!isCollapsed && (
              <div className="flex items-center justify-between mt-2 space-x-1">
                <Button
                  size="sm"
                  onClick={() => onCompleteWorkout(workout.id)}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none text-xs h-6 px-2"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ολοκλήρωση
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancelWorkout(workout.id)}
                  className="rounded-none text-xs h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
