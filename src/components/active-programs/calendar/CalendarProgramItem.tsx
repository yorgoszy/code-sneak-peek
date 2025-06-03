
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
    if (workoutStatus === 'completed') return '#00ffba';
    if (workoutStatus === 'missed') return '#ef4444';
    return '#3b82f6';
  };

  // Υπολογισμός progress
  const progressPercentage = program.progress || 0;
  const userName = program.app_users?.name || 'Άγνωστος χρήστης';

  return (
    <div 
      className="cursor-pointer hover:opacity-80 transition-opacity mb-1"
      onClick={onClick}
    >
      <div className="relative">
        <Progress 
          value={progressPercentage} 
          className="h-6 bg-gray-200 rounded-none"
          style={{
            '--progress-background': getStatusColor()
          } as React.CSSProperties}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white truncate px-2">
            {userName.split(' ')[0]}
          </span>
        </div>
      </div>
    </div>
  );
};
