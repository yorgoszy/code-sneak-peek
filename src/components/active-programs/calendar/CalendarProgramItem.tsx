
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
}

export const CalendarProgramItem: React.FC<CalendarProgramItemProps> = ({
  program,
  workoutStatus,
  allCompletions,
  onClick
}) => {
  const getStatusColor = () => {
    if (workoutStatus === 'completed') return 'bg-green-500';
    if (workoutStatus === 'missed') return 'bg-red-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (workoutStatus === 'completed') return 'Ολοκληρώθηκε';
    if (workoutStatus === 'missed') return 'Απουσία';
    return program.programs?.name || 'Πρόγραμμα';
  };

  // Υπολογισμός progress
  const progressPercentage = program.progress || 0;
  const userName = program.app_users?.name || 'Άγνωστος χρήστης';

  return (
    <div 
      className={`${getStatusColor()} text-white text-xs p-2 mb-1 cursor-pointer hover:opacity-80 transition-opacity rounded-none`}
      onClick={onClick}
    >
      <div className="space-y-1">
        {/* Όνομα προγράμματος και χρήστη */}
        <div className="font-medium truncate">
          {program.programs?.name || 'Πρόγραμμα'}
        </div>
        <div className="text-xs opacity-90 truncate">
          {userName.split(' ')[0]}
        </div>
        
        {/* Progress bar */}
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Progress 
              value={progressPercentage} 
              className="h-1 bg-white/20"
            />
          </div>
          <span className="text-xs font-medium min-w-8">
            {progressPercentage}%
          </span>
        </div>

        {/* Status */}
        <div className="text-xs opacity-90">
          {getStatusText()}
        </div>
      </div>
    </div>
  );
};
