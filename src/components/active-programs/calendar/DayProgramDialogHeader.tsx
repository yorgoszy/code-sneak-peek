
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Play, Square, Trash2, Minimize } from "lucide-react";

interface DayProgramDialogHeaderProps {
  selectedDate: Date;
  workoutInProgress: boolean;
  elapsedTime: number;
  workoutStatus: string;
  onStartWorkout: () => void;
  onCompleteWorkout: () => void;
  onCancelWorkout: () => void;
  onMinimize?: () => void;
}

export const DayProgramDialogHeader: React.FC<DayProgramDialogHeaderProps> = ({
  selectedDate,
  workoutInProgress,
  elapsedTime,
  workoutStatus,
  onStartWorkout,
  onCompleteWorkout,
  onCancelWorkout,
  onMinimize
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

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Προπόνηση - {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: el })}</span>
          
          {workoutInProgress && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-600 font-mono text-lg">
                {formatTime(elapsedTime)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <Badge 
            variant="outline" 
            className={`rounded-none ${
              workoutStatus === 'completed' ? 'bg-[#00ffba]/10 text-[#00ffba] border-[#00ffba]' :
              workoutStatus === 'in_progress' ? 'bg-red-100 text-red-600 border-red-300' :
              'bg-blue-100 text-blue-600 border-blue-300'
            }`}
          >
            {workoutStatus === 'completed' ? 'Ολοκληρωμένη' :
             workoutStatus === 'in_progress' ? 'Σε Εξέλιξη' : 'Προγραμματισμένη'}
          </Badge>

          {/* Action Buttons */}
          <div className="flex gap-1">
            {/* Minimize Button */}
            {onMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="rounded-none"
                title="Ελαχιστοποίηση"
              >
                <Minimize className="w-4 h-4" />
              </Button>
            )}

            {/* Start/Complete/Cancel Buttons */}
            {!workoutInProgress ? (
              <Button
                onClick={onStartWorkout}
                disabled={workoutStatus === 'completed'}
                className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
              >
                <Play className="w-4 h-4 mr-2" />
                Έναρξη
              </Button>
            ) : (
              <>
                <Button
                  onClick={onCompleteWorkout}
                  className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Ολοκλήρωση
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={onCancelWorkout}
                  className="rounded-none"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Ακύρωση
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogTitle>
    </DialogHeader>
  );
};
