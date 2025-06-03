
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

  // Υπολογισμός progress
  const progressPercentage = program.progress || 0;
  const userName = program.app_users?.name || 'Άγνωστος χρήστης';
  const programName = program.programs?.name || 'Πρόγραμμα';

  return (
    <div 
      className={`${getStatusColor()} text-white text-xs p-2 mb-1 cursor-pointer hover:opacity-80 transition-opacity rounded-none`}
      onClick={onClick}
    >
      <div className="space-y-1">
        {/* Όνομα χρήστη */}
        <div className="text-xs opacity-90 truncate">
          {userName.split(' ')[0]}
        </div>
        
        {/* Progress bar με το όνομα του προγράμματος μέσα */}
        <div className="relative">
          <Progress 
            value={progressPercentage} 
            className="h-4 bg-white/20"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white truncate px-1">
              {programName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
