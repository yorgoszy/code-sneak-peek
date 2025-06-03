
import React from 'react';
import { Clock } from "lucide-react";

interface WorkoutTimerDisplayProps {
  isVisible: boolean;
  startTime: Date;
}

export const WorkoutTimerDisplay: React.FC<WorkoutTimerDisplayProps> = ({
  isVisible,
  startTime
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 p-4 border border-blue-200 rounded-none">
      <div className="flex items-center justify-center space-x-2">
        <Clock className="w-5 h-5 text-blue-600" />
        <span className="text-blue-800 font-medium">
          Προπόνηση σε εξέλιξη - Ξεκίνησε στις {startTime.toLocaleTimeString('el-GR')}
        </span>
      </div>
    </div>
  );
};
