
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Play, CheckCircle, X, Clock, Minimize2 } from "lucide-react";
import { format } from "date-fns";

interface DayProgramDialogHeaderProps {
  selectedDate: Date;
  workoutInProgress: boolean;
  elapsedTime: number;
  workoutStatus: string;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
  onMinimize?: () => void;
  program?: any;
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
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const userName = program?.app_users?.name || 'Άγνωστος';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-8 h-8 rounded-none">
            <AvatarImage 
              src={program?.app_users?.photo_url} 
              alt={userName}
              className="rounded-none"
            />
            <AvatarFallback className="rounded-none bg-gray-200 text-gray-800 text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold">{userName}</div>
            <div className="text-xs text-gray-600">{format(selectedDate, 'dd/MM/yyyy')}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {workoutInProgress && (
            <div className="flex items-center gap-2 bg-[#00ffba] text-black px-3 py-1 rounded-none">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
            </div>
          )}
          
          <Badge 
            variant="outline" 
            className={`rounded-none ${
              workoutStatus === 'completed' ? 'bg-[#00ffba] text-black border-[#00ffba]' : ''
            }`}
          >
            {workoutStatus === 'completed' ? 'Ολοκληρωμένη' : 'Προγραμματισμένη'}
          </Badge>
        </div>
      </DialogTitle>

      <div className="flex items-center gap-2 mt-4">
        {!workoutInProgress && workoutStatus !== 'completed' && (
          <Button
            onClick={onStartWorkout}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Play className="w-4 h-4 mr-2" />
            Έναρξη Προπόνησης
          </Button>
        )}

        {workoutInProgress && (
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
            {onMinimize && (
              <Button
                onClick={onMinimize}
                variant="outline"
                className="rounded-none"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                Ελαχιστοποίηση
              </Button>
            )}
          </>
        )}
      </div>
    </DialogHeader>
  );
};
