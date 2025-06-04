
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
  dayPrograms?: EnrichedAssignment[];
  dayString?: string;
}

export const CalendarProgramItem: React.FC<CalendarProgramItemProps> = ({
  program,
  workoutStatus,
  allCompletions,
  onClick,
  showProgress = false,
  progressValue = 100,
  dayPrograms = [],
  dayString
}) => {
  const getStatusColor = () => {
    if (workoutStatus === 'completed') return '#00ffba'; // Πράσινο για ολοκληρωμένα
    if (workoutStatus === 'missed') return '#ef4444'; // Κόκκινο για χαμένα
    return '#3b82f6'; // Μπλε για προγραμματισμένα
  };

  const userName = program.app_users?.name || 'Άγνωστος χρήστης';

  // Υπολογισμός ολοκληρωμένων προπονήσεων για τη συγκεκριμένη μέρα
  const getCompletedWorkoutsForDay = () => {
    if (!dayString || dayPrograms.length === 0) {
      return { completed: 0, total: 1 };
    }

    const completedCount = dayPrograms.filter(dayProgram => {
      const completion = allCompletions.find(c => 
        c.assignment_id === dayProgram.id && 
        c.scheduled_date === dayString
      );
      return completion && completion.status === 'completed';
    }).length;

    return {
      completed: completedCount,
      total: dayPrograms.length
    };
  };

  const { completed, total } = showProgress ? getCompletedWorkoutsForDay() : { completed: 0, total: 1 };

  return (
    <div 
      className="cursor-pointer hover:opacity-80 transition-opacity mb-1"
      onClick={onClick}
    >
      <div className="relative">
        <Progress 
          value={showProgress ? (completed / total) * 100 : 100}
          indicatorColor={getStatusColor()}
          className="h-6 bg-gray-200 rounded-none"
        />
        <div className="absolute inset-0 flex items-center justify-between px-2">
          {showProgress ? (
            <>
              <span className="text-xs text-white/90 font-medium">
                {userName.split(' ')[0]}
              </span>
              <span className="text-xs font-medium text-white">
                {completed}/{total}
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-white/90 truncate">
              {userName.split(' ')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
