
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Square, X, Clock } from "lucide-react";
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
  if (runningWorkouts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {!isCollapsed && (
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Προπονήσεις σε Εξέλιξη ({runningWorkouts.length})
        </h3>
      )}
      
      <div className="space-y-2">
        {runningWorkouts.map((workout) => (
          <Card key={workout.id} className="rounded-none bg-red-50 border-red-200">
            <CardContent className="p-2">
              {isCollapsed ? (
                // Collapsed view - minimal info
                <div className="flex flex-col items-center space-y-1">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={workout.assignment.app_users?.photo_url || undefined} />
                    <AvatarFallback className="bg-gray-200 text-xs">
                      <User className="w-4 h-4 text-gray-500" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-xs font-mono text-red-600 text-center">
                    {formatTime(workout.elapsedTime)}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCompleteWorkout(workout.id)}
                      className="h-5 w-5 p-0 rounded-none text-[#00ffba] hover:bg-[#00ffba]/20"
                      title="Ολοκλήρωση"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancelWorkout(workout.id)}
                      className="h-5 w-5 p-0 rounded-none text-red-600 hover:bg-red-100"
                      title="Ακύρωση"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Expanded view - full info bar
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={workout.assignment.app_users?.photo_url || undefined} />
                      <AvatarFallback className="bg-gray-200">
                        <User className="w-4 h-4 text-gray-500" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {workout.assignment.app_users?.name}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {workout.assignment.programs?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(workout.selectedDate, 'dd/MM', { locale: el })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-600" />
                      <span className="text-xs font-mono text-red-600">
                        {formatTime(workout.elapsedTime)}
                      </span>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCompleteWorkout(workout.id)}
                        className="h-6 w-6 p-0 rounded-none text-[#00ffba] hover:bg-[#00ffba]/20"
                        title="Ολοκλήρωση"
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancelWorkout(workout.id)}
                        className="h-6 w-6 p-0 rounded-none text-red-600 hover:bg-red-100"
                        title="Ακύρωση"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
