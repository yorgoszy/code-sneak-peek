
import React from 'react';
import { DaySelector } from '../DaySelector';
import { ProgramViewDialog } from '../ProgramViewDialog';
import { DayProgramDialog } from '../calendar/DayProgramDialog';
import { AttendanceDialog } from '../AttendanceDialog';
import { ProgramBuilderDialog } from '@/components/programs/ProgramBuilderDialog';
import { ProgramViewer } from '../ProgramViewer';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardDialogManagerProps {
  assignment: EnrichedAssignment;
  daySelectorOpen: boolean;
  programViewDialogOpen: boolean;
  programViewerOpen: boolean;
  dayProgramDialogOpen: boolean;
  attendanceOpen: boolean;
  editDialogOpen: boolean;
  selectedDate: Date | null;
  users: any[];
  exercises: any[];
  onDaySelectorClose: () => void;
  onProgramViewClose: () => void;
  onProgramViewerClose: () => void;
  onDayProgramClose: () => void;
  onAttendanceClose: () => void;
  onEditDialogClose: () => void;
  onSelectDay: (weekIndex: number, dayIndex: number) => void;
  onEditSave: (programData: any) => Promise<void>;
  onRefresh?: () => void;
}

export const ProgramCardDialogManager: React.FC<ProgramCardDialogManagerProps> = ({
  assignment,
  daySelectorOpen,
  programViewDialogOpen,
  programViewerOpen,
  dayProgramDialogOpen,
  attendanceOpen,
  editDialogOpen,
  selectedDate,
  users,
  exercises,
  onDaySelectorClose,
  onProgramViewClose,
  onProgramViewerClose,
  onDayProgramClose,
  onAttendanceClose,
  onEditDialogClose,
  onSelectDay,
  onEditSave,
  onRefresh
}) => {
  // Prepare assignment data for editing
  const assignmentEditData = {
    id: assignment.id,
    user_id: assignment.user_id,
    training_dates: assignment.training_dates || []
  };

  return (
    <>
      <DaySelector
        assignment={assignment}
        isOpen={daySelectorOpen}
        onClose={onDaySelectorClose}
        onSelectDay={onSelectDay}
      />

      <ProgramViewDialog
        isOpen={programViewDialogOpen}
        onClose={onProgramViewClose}
        assignment={assignment}
      />

      <ProgramViewer
        assignment={assignment}
        isOpen={programViewerOpen}
        onClose={onProgramViewerClose}
        mode="start"
      />

      <DayProgramDialog
        isOpen={dayProgramDialogOpen}
        onClose={onDayProgramClose}
        program={assignment}
        selectedDate={selectedDate}
        workoutStatus="not_started"
        onRefresh={onRefresh}
      />

      <AttendanceDialog
        assignment={assignment}
        isOpen={attendanceOpen}
        onClose={onAttendanceClose}
      />

      <ProgramBuilderDialog
        users={users}
        exercises={exercises}
        onCreateProgram={onEditSave}
        onOpenChange={onEditDialogClose}
        editingProgram={assignment.programs}
        editingAssignment={assignmentEditData}
        isOpen={editDialogOpen}
      />
    </>
  );
};
