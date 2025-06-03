
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
  date: Date;
  completion: any;
  onRefresh?: () => void;
}

export const CalendarProgramItem: React.FC<CalendarProgramItemProps> = ({
  program,
  date,
  completion,
  onRefresh
}) => {
  const [dayProgramDialogOpen, setDayProgramDialogOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'start'>('view');

  const getStatusColor = () => {
    if (completion?.status === 'completed') return 'bg-green-500';
    if (completion?.status === 'missed') return 'bg-red-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (completion?.status === 'completed') return 'Ολοκληρώθηκε';
    if (completion?.status === 'missed') return 'Απουσία';
    return program.programs?.name || 'Πρόγραμμα';
  };

  const handleView = () => {
    setDialogMode('view');
    setDayProgramDialogOpen(true);
  };

  const handleStart = () => {
    setDialogMode('start');
    setDayProgramDialogOpen(true);
  };

  const handleComplete = () => {
    setAttendanceOpen(true);
  };

  const handleDialogClose = () => {
    setDayProgramDialogOpen(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  // Υπολογισμός progress
  const totalWorkouts = program.training_dates?.length || 0;
  const progressPercentage = program.progress || 0;

  const userName = program.app_users?.name || 'Άγνωστος χρήστης';

  return (
    <>
      <div 
        className={`${getStatusColor()} text-white text-xs p-2 mb-1 cursor-pointer hover:opacity-80 transition-opacity rounded-none`}
        onClick={handleView}
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

        {/* Action buttons - μόνο όταν hover */}
        <div className="flex space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            className="h-5 w-5 p-0 rounded-none border-white/30 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
            title="Προβολή"
          >
            <Eye className="w-2.5 h-2.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-5 w-5 p-0 rounded-none border-white/30 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
            title="Έναρξη"
          >
            <Play className="w-2.5 h-2.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-5 w-5 p-0 rounded-none border-white/30 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              handleComplete();
            }}
            title="Ολοκλήρωση"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>

      <DayProgramDialog
        isOpen={dayProgramDialogOpen}
        onClose={handleDialogClose}
        program={program}
        selectedDate={date}
        workoutStatus={completion?.status || 'not_started'}
        onRefresh={onRefresh}
      />

      <AttendanceDialog
        assignment={program}
        isOpen={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
      />
    </>
  );
};
