
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Play, CheckCircle2 } from "lucide-react";
import { DayProgramDialog } from './DayProgramDialog';
import { AttendanceDialog } from '../AttendanceDialog';
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarProgramItemProps {
  program: EnrichedAssignment;
  workoutStatus: any;
  allCompletions: any[];
  onClick: () => void;
  showProgress?: boolean;
  progressValue?: number;
}

export const CalendarProgramItem: React.FC<CalendarProgramItemProps> = ({
  program,
  workoutStatus,
  allCompletions,
  onClick,
  showProgress = false,
  progressValue = 100
}) => {
  const getStatusColor = () => {
    if (workoutStatus === 'completed') return '#48926c'; // Πράσινο
    if (workoutStatus === 'missed') return '#ef4444';
    return '#1c5d86'; // Μπλε
  };

  const userName = program.app_users?.name || 'Άγνωστος χρήστης';

  return (
    <div 
      className="cursor-pointer hover:opacity-80 transition-opacity mb-1"
      onClick={onClick}
    >
      <div className="relative">
        <Progress 
          value={showProgress ? progressValue : 100}
          indicatorColor={getStatusColor()}
          className="h-5 bg-gray-200 rounded-none"
        />
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-white truncate">
            {userName.split(' ')[0]}
          </span>
          {showProgress && (
            <span className="text-xs font-medium text-white">
              {progressValue}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
