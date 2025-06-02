
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Eye, Edit, CheckCircle2 } from "lucide-react";
import { ProgramViewer } from './ProgramViewer';
import { DaySelector } from './DaySelector';
import { AttendanceDialog } from './AttendanceDialog';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardActionsProps {
  assignment: EnrichedAssignment;
}

export const ProgramCardActions: React.FC<ProgramCardActionsProps> = ({ assignment }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMode, setViewerMode] = useState<'view' | 'start'>('view');
  const [daySelectorOpen, setDaySelectorOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);

  const handleStart = () => {
    setDaySelectorOpen(true);
  };

  const handleDaySelected = (weekIndex: number, dayIndex: number) => {
    setSelectedWeek(weekIndex);
    setSelectedDay(dayIndex);
    setViewerMode('start');
    setViewerOpen(true);
  };

  const handleView = () => {
    setViewerMode('view');
    setViewerOpen(true);
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit program:', assignment.id);
  };

  const handleComplete = () => {
    setAttendanceOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button 
          size="sm" 
          variant="outline" 
          className="rounded-none flex items-center gap-1"
          onClick={handleStart}
        >
          <Play className="w-4 h-4" />
          Έναρξη
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="rounded-none flex items-center gap-1"
          onClick={handleView}
        >
          <Eye className="w-4 h-4" />
          Προβολή
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="rounded-none flex items-center gap-1"
          onClick={handleEdit}
        >
          <Edit className="w-4 h-4" />
          Επεξεργασία
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="rounded-none flex items-center gap-1"
          onClick={handleComplete}
        >
          <CheckCircle2 className="w-4 h-4" />
          Ολοκλήρωση
        </Button>
      </div>

      <DaySelector
        assignment={assignment}
        isOpen={daySelectorOpen}
        onClose={() => setDaySelectorOpen(false)}
        onSelectDay={handleDaySelected}
      />

      <ProgramViewer
        assignment={assignment}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        mode={viewerMode}
        selectedWeek={selectedWeek}
        selectedDay={selectedDay}
      />

      <AttendanceDialog
        assignment={assignment}
        isOpen={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
      />
    </>
  );
};
